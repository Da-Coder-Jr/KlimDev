// main.rs
//
// KlimDev AI Terminal -- entry point and event loop.
//
// Architecture overview
// =====================
//
//  +-------------------+       tokio mpsc       +----------------------+
//  |   UI Event Loop   | <--------------------> | API Streaming Task   |
//  |   (main task)     |    ApiEvent channel     | (spawned per query)  |
//  +-------------------+                        +----------------------+
//          ^
//          |  crossterm EventStream
//  +-------------------+
//  |  Terminal (stdin) |
//  +-------------------+
//
// The main task owns the AppState and the Terminal handle.  It runs a
// `tokio::select!` loop that concurrently waits on:
//
//   1. Terminal input events   -- translated to Action and applied to state.
//   2. API channel events      -- token fragments and lifecycle events.
//
// When the user submits a message, a new tokio task is spawned that:
//   - Calls NimClient::stream_chat
//   - Drives the SSE stream to completion via api::streaming::drive_sse_stream
//   - Sends ApiEvent variants over a bounded mpsc channel
//
// The UI redraws on every event (key press or API token), giving a
// sub-frame-latency feel for streaming.  A 16 ms ticker is NOT used because
// redrawing only on mutations is cheaper and eliminates flicker.

use std::io::{stdout, Stdout};

use anyhow::{Context, Result};
use crossterm::{
    event::{
        DisableMouseCapture, EnableMouseCapture, Event, EventStream, KeyCode, KeyModifiers,
    },
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use futures_util::StreamExt;
use ratatui::{backend::CrosstermBackend, Terminal};
use tokio::sync::mpsc;

mod api;
mod app;
mod config;
mod telemetry;
mod ui;

use api::{ApiEvent, NimClient};
use app::{Action, AppState};
use config::Settings;

/// Bounded channel capacity.  We keep this small so back-pressure is visible
/// to the user (token delivery slows down) rather than buffering gigabytes.
const API_CHANNEL_CAPACITY: usize = 512;

// ---------------------------------------------------------------------------
// Terminal lifecycle helpers
// ---------------------------------------------------------------------------

/// Initialise the terminal: raw mode + alternate screen + mouse capture.
fn init_terminal() -> Result<Terminal<CrosstermBackend<Stdout>>> {
    enable_raw_mode().context("Failed to enable raw mode")?;
    let mut stdout = stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)
        .context("Failed to enter alternate screen")?;
    let backend = CrosstermBackend::new(stdout);
    Terminal::new(backend).context("Failed to create terminal")
}

/// Restore the terminal to its original state on exit.
fn restore_terminal(terminal: &mut Terminal<CrosstermBackend<Stdout>>) -> Result<()> {
    disable_raw_mode().context("Failed to disable raw mode")?;
    execute!(
        terminal.backend_mut(),
        LeaveAlternateScreen,
        DisableMouseCapture
    )
    .context("Failed to leave alternate screen")?;
    terminal.show_cursor().context("Failed to show cursor")?;
    Ok(())
}

// ---------------------------------------------------------------------------
// Input event translation
// ---------------------------------------------------------------------------

/// Convert a crossterm key event into an application Action.
/// Returns None for events that require no state change.
fn key_to_action(event: crossterm::event::KeyEvent) -> Option<Action> {
    use KeyCode::*;
    use KeyModifiers as Mods;

    match (event.modifiers, event.code) {
        // Quit
        (Mods::CONTROL, Char('c')) | (Mods::CONTROL, Char('q')) => Some(Action::Quit),

        // Submit
        (Mods::NONE, Enter) => Some(Action::SubmitInput),

        // Character input
        (Mods::NONE | Mods::SHIFT, Char(c)) => Some(Action::InputChar(c)),

        // Editing
        (Mods::NONE, Backspace) => Some(Action::InputBackspace),
        (Mods::NONE, Delete) => Some(Action::InputDelete),

        // Cursor movement
        (Mods::NONE, Left) => Some(Action::CursorLeft),
        (Mods::NONE, Right) => Some(Action::CursorRight),
        (Mods::NONE, Home) => Some(Action::CursorHome),
        (Mods::NONE, End) => Some(Action::CursorEnd),

        // Scrolling
        (Mods::NONE, PageUp) => Some(Action::ScrollUp),
        (Mods::NONE, PageDown) => Some(Action::ScrollDown),

        // Ctrl+End for jump to bottom
        (Mods::CONTROL, End) => Some(Action::ScrollBottom),

        // Clear conversation
        (Mods::CONTROL, Char('l')) => Some(Action::ClearConversation),

        // Dismiss error
        (Mods::NONE, Esc) => Some(Action::DismissError),

        _ => None,
    }
}

// ---------------------------------------------------------------------------
// API event translation
// ---------------------------------------------------------------------------

/// Translate an ApiEvent into an Action for the state machine.
fn api_event_to_action(event: ApiEvent) -> Action {
    match event {
        ApiEvent::Token(t) => Action::AppendToken(t),
        ApiEvent::StreamComplete { usage, total_ms } => {
            let (prompt_tokens, completion_tokens) = usage
                .map(|u| (u.prompt_tokens, u.completion_tokens))
                .unwrap_or((0, 0));
            Action::StreamDone {
                total_ms,
                prompt_tokens,
                completion_tokens,
            }
        }
        ApiEvent::StreamError(e) => Action::StreamError(e),
    }
}

// ---------------------------------------------------------------------------
// Main event loop
// ---------------------------------------------------------------------------

#[tokio::main]
async fn main() -> Result<()> {
    // Load configuration from environment.
    let settings = Settings::from_env().unwrap_or_else(|e| {
        // Print to stderr before entering raw mode.
        eprintln!("Configuration error: {e}");
        std::process::exit(1);
    });

    // Build the HTTP client (cheap -- no connections established yet).
    let nim_client = NimClient::new(&settings)
        .context("Failed to construct NIM HTTP client")?;

    // Initialise application state.
    let mut state = AppState::new(
        settings.model.clone(),
        settings.context_window_messages,
    );

    // Set up the terminal.
    let mut terminal = init_terminal()?;

    // Channel for API events.  The sender is cloned into each streaming task.
    let (api_tx, mut api_rx) = mpsc::channel::<ApiEvent>(API_CHANNEL_CAPACITY);

    // Async terminal event stream (crossterm EventStream is backed by tokio).
    let mut term_stream = EventStream::new();

    // ---- Main event loop ----
    // We draw once before entering the loop so the UI is visible immediately.
    terminal.draw(|f| ui::render(f, &state))?;

    loop {
        // Draw the current state BEFORE waiting for the next event.
        // This guarantees that every state mutation produces exactly one
        // redraw, which is cheaper than a ticker-based approach and
        // eliminates the "one frame behind" visual artifact.
        terminal.draw(|f| ui::render(f, &state))?;

        // Wait concurrently on terminal events and API events.
        let should_continue = tokio::select! {
            // Terminal input event
            maybe_event = term_stream.next() => {
                match maybe_event {
                    Some(Ok(Event::Key(key))) => {
                        if let Some(action) = key_to_action(key) {
                            let is_submit = matches!(action, Action::SubmitInput);
                            let cont = state.apply(action);

                            // If the user submitted a message, kick off the API request.
                            if is_submit && state.is_streaming() {
                                let context = state.build_api_context();
                                let client = nim_client.clone();
                                let tx = api_tx.clone();
                                tokio::spawn(async move {
                                    if let Err(e) = client.stream_chat(context, tx.clone()).await {
                                        let _ = tx.send(ApiEvent::StreamError(e.to_string())).await;
                                    }
                                });
                            }

                            cont
                        } else {
                            true
                        }
                    }
                    Some(Ok(Event::Resize(_, _))) => {
                        // Force a redraw on resize; state unchanged.
                        true
                    }
                    Some(Err(e)) => {
                        state.apply(Action::StreamError(format!("Terminal I/O error: {e}")));
                        true
                    }
                    _ => true,
                }
            }

            // API streaming event
            maybe_api = api_rx.recv() => {
                match maybe_api {
                    Some(event) => {
                        let action = api_event_to_action(event);
                        state.apply(action)
                    }
                    None => {
                        // Channel closed -- no active streams.
                        true
                    }
                }
            }
        };

        if !should_continue {
            break;
        }
    }

    // Restore the terminal before exiting.
    restore_terminal(&mut terminal)?;

    println!("KlimDev AI Terminal closed. Goodbye.");
    Ok(())
}
