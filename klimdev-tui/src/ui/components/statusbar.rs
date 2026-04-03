// ui/components/statusbar.rs
//
// Single-line status bar anchored to the bottom of the terminal.
//
// Priority order (highest to lowest):
//   1. Active error -- displayed in red with a dismiss hint.
//   2. Streaming indicator -- with live elapsed time.
//   3. Default idle hint.

use ratatui::{
    layout::{Alignment, Rect},
    text::{Line, Span},
    widgets::Paragraph,
    Frame,
};

use crate::app::state::{AppMode, AppState};
use crate::ui::theme;

/// Render the bottom status bar.
pub fn render(f: &mut Frame, area: Rect, state: &AppState) {
    let line = if let Some(err) = &state.last_error {
        // Truncate long errors to fit in one line.
        let max_len = area.width.saturating_sub(22) as usize;
        let truncated = if err.len() > max_len {
            format!("{}...", &err[..max_len.saturating_sub(3)])
        } else {
            err.clone()
        };
        Line::from(vec![
            Span::styled(" [ERR] ", theme::error()),
            Span::styled(truncated, theme::error()),
            Span::styled("  Press Esc to dismiss ", theme::dimmed()),
        ])
    } else if state.mode == AppMode::Streaming {
        let elapsed = state
            .telemetry
            .elapsed_ms()
            .map(|ms| format!("{ms}ms"))
            .unwrap_or_else(|| "...".to_string());
        let tokens = state.telemetry.current_tokens;
        Line::from(vec![
            Span::styled(" STREAMING ", theme::pulse()),
            Span::styled(format!(" {tokens} tokens  {elapsed} "), theme::telemetry_value()),
            Span::styled(
                "  C-c or C-q to force quit ",
                theme::dimmed(),
            ),
        ])
    } else {
        Line::from(vec![
            Span::styled(" KLIMDEV ", theme::header_title()),
            Span::styled(
                "  v1.0.0  |  Enter: send  |  PgUp/PgDn: scroll  |  Ctrl+L: clear  |  Ctrl+C: quit ",
                theme::dimmed(),
            ),
        ])
    };

    let paragraph = Paragraph::new(line)
        .style(theme::base())
        .alignment(Alignment::Left);

    f.render_widget(paragraph, area);
}
