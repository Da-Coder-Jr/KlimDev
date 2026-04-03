// app/state.rs
//
// AppState is the single source of truth for the entire application.  It owns
// the conversation history, the live input buffer, viewport scroll position,
// current streaming state, and the telemetry snapshot.
//
// Mutation happens exclusively through AppState::apply(Action), which keeps
// all business logic in one place and makes the state transition surface
// explicit and auditable.

use chrono::{DateTime, Local};
use uuid::Uuid;

use crate::api::models::ChatMessage;
use crate::app::actions::Action;
use crate::telemetry::TelemetryMetrics;

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

/// The role of a message author.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Role {
    System,
    User,
    Assistant,
}

impl Role {
    #[allow(dead_code)]
    pub fn as_str(&self) -> &'static str {
        match self {
            Role::System => "SYSTEM",
            Role::User => "USER",
            Role::Assistant => "ASSISTANT",
        }
    }

    pub fn api_str(&self) -> &'static str {
        match self {
            Role::System => "system",
            Role::User => "user",
            Role::Assistant => "assistant",
        }
    }
}

/// A single message in the conversation.
#[derive(Debug, Clone)]
pub struct Message {
    #[allow(dead_code)]
    pub id: Uuid,
    pub role: Role,
    /// Full text content.  For assistant messages that are still streaming,
    /// this string grows character-by-character.
    pub content: String,
    pub timestamp: DateTime<Local>,
}

impl Message {
    pub fn new(role: Role, content: impl Into<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            role,
            content: content.into(),
            timestamp: Local::now(),
        }
    }
}

/// High-level application mode, driving UI and key-binding behaviour.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AppMode {
    /// Normal interactive mode: the user types in the input box.
    Normal,
    /// The application is waiting for the stream to finish.
    Streaming,
    /// The application is shutting down.
    Quitting,
}

// ---------------------------------------------------------------------------
// AppState
// ---------------------------------------------------------------------------

/// Central, owned application state.  One instance lives in main.rs for the
/// duration of the process.
pub struct AppState {
    // ---- Conversation ----

    /// All messages in the current session, in chronological order.
    pub messages: Vec<Message>,

    /// The fixed system prompt prepended to every API request.
    pub system_prompt: String,

    /// Maximum number of assistant + user turns retained for API context.
    pub context_window_messages: usize,

    // ---- Input ----

    /// Current contents of the input field.
    pub input: String,

    /// Byte-index of the cursor within `input`.
    pub cursor_pos: usize,

    // ---- Viewport ----

    /// The total number of rendered lines in the chat pane (updated each frame).
    #[allow(dead_code)]
    pub total_chat_lines: u16,

    /// Scroll offset from the bottom, in lines.  0 = pinned to the bottom.
    pub scroll_offset: u16,

    // ---- Mode ----

    pub mode: AppMode,

    // ---- Error display ----

    /// Optional error message displayed in the status bar.
    pub last_error: Option<String>,

    // ---- Telemetry ----

    pub telemetry: TelemetryMetrics,

    // ---- Metadata ----

    pub model_name: String,

    /// Tracks whether the user has manually scrolled up (disables auto-scroll).
    pub user_scrolled: bool,
}

impl AppState {
    /// Construct a fresh application state.
    pub fn new(model_name: String, context_window_messages: usize) -> Self {
        let system_prompt = "You are KlimDev AI, an expert software engineer and systems architect \
            specialising in Rust, high-performance computing, and distributed systems. \
            Provide concise, technically precise answers with runnable code examples \
            where appropriate. Use plain text; do not use markdown headers or emojis."
            .to_string();

        Self {
            messages: Vec::new(),
            system_prompt,
            context_window_messages,
            input: String::new(),
            cursor_pos: 0,
            total_chat_lines: 0,
            scroll_offset: 0,
            mode: AppMode::Normal,
            last_error: None,
            telemetry: TelemetryMetrics::default(),
            model_name,
            user_scrolled: false,
        }
    }

    // -----------------------------------------------------------------------
    // State mutation
    // -----------------------------------------------------------------------

    /// Apply an action, updating state in place.
    ///
    /// Returns `true` if the application should continue running, `false` if
    /// it should terminate.
    pub fn apply(&mut self, action: Action) -> bool {
        match action {
            Action::Quit => {
                self.mode = AppMode::Quitting;
                return false;
            }

            Action::InputChar(c) => {
                if self.mode == AppMode::Normal {
                    self.input.insert(self.cursor_pos, c);
                    self.cursor_pos += c.len_utf8();
                }
            }

            Action::InputBackspace => {
                if self.mode == AppMode::Normal && self.cursor_pos > 0 {
                    // Find the start of the preceding character.
                    let prev = self.prev_char_boundary(self.cursor_pos);
                    self.input.drain(prev..self.cursor_pos);
                    self.cursor_pos = prev;
                }
            }

            Action::InputDelete => {
                if self.mode == AppMode::Normal && self.cursor_pos < self.input.len() {
                    let next = self.next_char_boundary(self.cursor_pos);
                    self.input.drain(self.cursor_pos..next);
                }
            }

            Action::CursorLeft => {
                if self.cursor_pos > 0 {
                    self.cursor_pos = self.prev_char_boundary(self.cursor_pos);
                }
            }

            Action::CursorRight => {
                if self.cursor_pos < self.input.len() {
                    self.cursor_pos = self.next_char_boundary(self.cursor_pos);
                }
            }

            Action::CursorHome => {
                self.cursor_pos = 0;
            }

            Action::CursorEnd => {
                self.cursor_pos = self.input.len();
            }

            Action::SubmitInput => {
                if self.mode != AppMode::Normal {
                    return true;
                }
                let text = self.input.trim().to_string();
                if text.is_empty() {
                    return true;
                }
                self.messages.push(Message::new(Role::User, text));
                // Push a placeholder for the assistant response that will be
                // populated token-by-token during streaming.
                self.messages.push(Message::new(Role::Assistant, ""));
                self.input.clear();
                self.cursor_pos = 0;
                self.mode = AppMode::Streaming;
                self.user_scrolled = false;
                self.scroll_offset = 0;
                self.telemetry.on_request_start();
            }

            Action::AppendToken(token) => {
                self.telemetry.on_token_received();
                if let Some(msg) = self.messages.last_mut() {
                    if msg.role == Role::Assistant {
                        msg.content.push_str(&token);
                    }
                }
                // Auto-scroll to bottom unless the user has manually scrolled.
                if !self.user_scrolled {
                    self.scroll_offset = 0;
                }
            }

            Action::StreamDone { total_ms, prompt_tokens, completion_tokens } => {
                self.mode = AppMode::Normal;
                self.telemetry.on_stream_complete(total_ms, prompt_tokens, completion_tokens);
            }

            Action::StreamError(msg) => {
                self.mode = AppMode::Normal;
                self.last_error = Some(msg.clone());
                self.telemetry.on_stream_error();
                // Replace the placeholder assistant message with the error text.
                if let Some(last) = self.messages.last_mut() {
                    if last.role == Role::Assistant && last.content.is_empty() {
                        last.content = format!("[Error: {msg}]");
                    }
                }
            }

            Action::ScrollUp => {
                self.scroll_offset = self.scroll_offset.saturating_add(3);
                self.user_scrolled = self.scroll_offset > 0;
            }

            Action::ScrollDown => {
                if self.scroll_offset > 0 {
                    self.scroll_offset = self.scroll_offset.saturating_sub(3);
                }
                if self.scroll_offset == 0 {
                    self.user_scrolled = false;
                }
            }

            Action::ScrollBottom => {
                self.scroll_offset = 0;
                self.user_scrolled = false;
            }

            Action::ToggleCommandMode => {
                // Reserved for future command-mode implementation.
            }

            Action::DismissError => {
                self.last_error = None;
            }

            Action::ClearConversation => {
                self.messages.clear();
                self.input.clear();
                self.cursor_pos = 0;
                self.scroll_offset = 0;
                self.user_scrolled = false;
                self.last_error = None;
                self.mode = AppMode::Normal;
            }
        }

        true
    }

    // -----------------------------------------------------------------------
    // Context builder
    // -----------------------------------------------------------------------

    /// Build the `messages` array for the next API request.
    ///
    /// The system prompt is always prepended.  We then take the most recent
    /// `context_window_messages` pairs from the conversation, excluding the
    /// empty assistant placeholder that was added for the streaming response.
    pub fn build_api_context(&self) -> Vec<ChatMessage> {
        let mut out = vec![ChatMessage::system(self.system_prompt.clone())];

        // Gather all messages except the last (empty assistant placeholder).
        let history: Vec<&Message> = self
            .messages
            .iter()
            .filter(|m| m.role != Role::System)
            .rev()
            .skip(1) // skip the empty placeholder
            .take(self.context_window_messages)
            .collect::<Vec<_>>()
            .into_iter()
            .rev()
            .collect();

        for msg in history {
            out.push(ChatMessage {
                role: msg.role.api_str().to_string(),
                content: msg.content.clone(),
            });
        }

        out
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    fn prev_char_boundary(&self, pos: usize) -> usize {
        let mut p = pos.saturating_sub(1);
        while p > 0 && !self.input.is_char_boundary(p) {
            p -= 1;
        }
        p
    }

    fn next_char_boundary(&self, pos: usize) -> usize {
        let mut p = pos + 1;
        while p < self.input.len() && !self.input.is_char_boundary(p) {
            p += 1;
        }
        p
    }

    /// True if the application is in the process of streaming a response.
    pub fn is_streaming(&self) -> bool {
        self.mode == AppMode::Streaming
    }

    /// Returns a display-safe truncation of the model name.
    pub fn short_model_name(&self) -> &str {
        self.model_name
            .rsplit('/')
            .next()
            .unwrap_or(&self.model_name)
    }
}
