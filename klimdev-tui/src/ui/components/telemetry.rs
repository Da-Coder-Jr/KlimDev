// ui/components/telemetry.rs
//
// Real-time telemetry panel (right sidebar).
//
// Displays live and historical performance metrics:
//   - Tokens per second (live while streaming, last completed otherwise)
//   - Time to first token (last completed request)
//   - Total stream duration
//   - Prompt / completion token counts
//   - Lifetime session counters
//
// All values are formatted to fit within the narrow 28-column panel.

use ratatui::{
    layout::{Constraint, Direction, Layout, Rect},
    text::{Line, Span},
    widgets::{Block, BorderType, Borders, Gauge, Paragraph},
    Frame,
};

use crate::app::state::{AppMode, AppState};
use crate::ui::theme;

/// Maximum tokens to display on the token gauge (arbitrary scale for UX).
const TOKEN_GAUGE_MAX: u32 = 2048;

/// Render the telemetry panel.
pub fn render(f: &mut Frame, area: Rect, state: &AppState) {
    let is_streaming = state.mode == AppMode::Streaming;

    // Split the telemetry column into three sub-panels.
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(10), // live metrics
            Constraint::Length(8),  // session counters
            Constraint::Min(4),     // token progress gauge
        ])
        .split(area);

    render_live_metrics(f, chunks[0], state, is_streaming);
    render_session_counters(f, chunks[1], state);
    render_token_gauge(f, chunks[2], state);
}

fn render_live_metrics(f: &mut Frame, area: Rect, state: &AppState, is_streaming: bool) {
    let t = &state.telemetry;

    let tps_display = if is_streaming {
        t.live_tps()
            .map(|v| format!("{v:.1} t/s"))
            .unwrap_or_else(|| "waiting...".to_string())
    } else {
        t.last_tps
            .map(|v| format!("{v:.1} t/s"))
            .unwrap_or_else(|| "n/a".to_string())
    };

    let ttft_display = t
        .last_ttft_ms
        .map(|ms| format!("{ms} ms"))
        .unwrap_or_else(|| "n/a".to_string());

    let duration_display = if is_streaming {
        t.elapsed_ms()
            .map(|ms| format!("{ms} ms"))
            .unwrap_or_else(|| "n/a".to_string())
    } else {
        t.last_total_ms
            .map(|ms| format!("{ms} ms"))
            .unwrap_or_else(|| "n/a".to_string())
    };

    let cur_tokens = if is_streaming {
        format!("{}", t.current_tokens)
    } else {
        format!("{}", t.last_completion_tokens)
    };

    let prompt_tokens = format!("{}", t.last_prompt_tokens);

    let status_span = if is_streaming {
        Span::styled("LIVE", theme::pulse())
    } else {
        Span::styled("IDLE", theme::success())
    };

    let lines = vec![
        Line::from(vec![
            Span::styled("STATUS  ", theme::telemetry_key()),
            status_span,
        ]),
        Line::from(""),
        Line::from(vec![
            Span::styled("TPS     ", theme::telemetry_key()),
            Span::styled(tps_display, theme::telemetry_value()),
        ]),
        Line::from(vec![
            Span::styled("TTFT    ", theme::telemetry_key()),
            Span::styled(ttft_display, theme::telemetry_value()),
        ]),
        Line::from(vec![
            Span::styled("ELAPSED ", theme::telemetry_key()),
            Span::styled(duration_display, theme::telemetry_value()),
        ]),
        Line::from(""),
        Line::from(vec![
            Span::styled("PROMPT  ", theme::telemetry_key()),
            Span::styled(prompt_tokens, theme::telemetry_value()),
        ]),
        Line::from(vec![
            Span::styled("COMPLT  ", theme::telemetry_key()),
            Span::styled(cur_tokens, theme::telemetry_value()),
        ]),
    ];

    let block = Block::default()
        .title(Span::styled(" METRICS ", theme::header_title()))
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(if is_streaming {
            theme::border_active()
        } else {
            theme::border_inactive()
        })
        .style(theme::base());

    let paragraph = Paragraph::new(lines).block(block);
    f.render_widget(paragraph, area);
}

fn render_session_counters(f: &mut Frame, area: Rect, state: &AppState) {
    let t = &state.telemetry;

    let lines = vec![
        Line::from(vec![
            Span::styled("TURNS   ", theme::telemetry_key()),
            Span::styled(format!("{}", t.total_user_turns), theme::telemetry_value()),
        ]),
        Line::from(vec![
            Span::styled("TOTAL T ", theme::telemetry_key()),
            Span::styled(
                format!("{}", t.total_tokens_generated),
                theme::telemetry_value(),
            ),
        ]),
        Line::from(vec![
            Span::styled("SUCCESS ", theme::telemetry_key()),
            Span::styled(
                format!("{}", t.total_successful_streams),
                theme::success(),
            ),
        ]),
        Line::from(vec![
            Span::styled("ERRORS  ", theme::telemetry_key()),
            Span::styled(
                format!("{}", t.total_failed_streams),
                if t.total_failed_streams > 0 {
                    theme::error()
                } else {
                    theme::dimmed()
                },
            ),
        ]),
        Line::from(vec![
            Span::styled("MODEL   ", theme::telemetry_key()),
            Span::styled(state.short_model_name().to_string(), theme::label()),
        ]),
    ];

    let block = Block::default()
        .title(Span::styled(" SESSION ", theme::header_title()))
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(theme::border_inactive())
        .style(theme::base());

    let paragraph = Paragraph::new(lines).block(block);
    f.render_widget(paragraph, area);
}

fn render_token_gauge(f: &mut Frame, area: Rect, state: &AppState) {
    let t = &state.telemetry;
    let generated = if state.mode == AppMode::Streaming {
        t.current_tokens
    } else {
        t.last_completion_tokens
    };

    let ratio = (generated as f64 / TOKEN_GAUGE_MAX as f64).min(1.0);

    let label = format!("{generated} / {TOKEN_GAUGE_MAX}");

    let gauge = Gauge::default()
        .block(
            Block::default()
                .title(Span::styled(" TOKENS ", theme::header_title()))
                .borders(Borders::ALL)
                .border_type(BorderType::Rounded)
                .border_style(theme::border_inactive())
                .style(theme::base()),
        )
        .gauge_style(theme::telemetry_value())
        .ratio(ratio)
        .label(label);

    f.render_widget(gauge, area);
}
