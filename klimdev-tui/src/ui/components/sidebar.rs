// ui/components/sidebar.rs
//
// Left sidebar: session summary and keyboard shortcut reference.
//
// The sidebar renders two stacked sub-panels:
//   1. Session info panel -- message counts, token totals.
//   2. Keybindings reference panel -- always visible quick-reference.

use ratatui::{
    layout::{Constraint, Direction, Layout, Rect},
    text::{Line, Span},
    widgets::{Block, BorderType, Borders, Paragraph},
    Frame,
};

use crate::app::state::AppState;
use crate::ui::theme;

/// Render the left sidebar.
pub fn render(f: &mut Frame, area: Rect, state: &AppState) {
    // Split the sidebar vertically into session info and keybindings.
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Min(8), Constraint::Length(14)])
        .split(area);

    render_session_info(f, chunks[0], state);
    render_keybindings(f, chunks[1]);
}

fn render_session_info(f: &mut Frame, area: Rect, state: &AppState) {
    let user_count = state
        .messages
        .iter()
        .filter(|m| m.role == crate::app::state::Role::User)
        .count();

    let assistant_count = state
        .messages
        .iter()
        .filter(|m| m.role == crate::app::state::Role::Assistant)
        .count();

    let lines = vec![
        Line::from(vec![
            Span::styled("TURNS  ", theme::label()),
            Span::styled(format!("{}", state.telemetry.total_user_turns), theme::telemetry_value()),
        ]),
        Line::from(vec![
            Span::styled("USER   ", theme::label()),
            Span::styled(format!("{}", user_count), theme::telemetry_value()),
        ]),
        Line::from(vec![
            Span::styled("ASST   ", theme::label()),
            Span::styled(format!("{}", assistant_count), theme::telemetry_value()),
        ]),
        Line::from(""),
        Line::from(vec![
            Span::styled("TOKENS ", theme::label()),
            Span::styled(
                format!("{}", state.telemetry.total_tokens_generated),
                theme::telemetry_value(),
            ),
        ]),
        Line::from(vec![
            Span::styled("ERRORS ", theme::label()),
            Span::styled(
                format!("{}", state.telemetry.total_failed_streams),
                if state.telemetry.total_failed_streams > 0 {
                    theme::error()
                } else {
                    theme::success()
                },
            ),
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

fn render_keybindings(f: &mut Frame, area: Rect) {
    let lines = vec![
        Line::from(vec![
            Span::styled("Enter    ", theme::telemetry_value()),
            Span::styled("send", theme::label()),
        ]),
        Line::from(vec![
            Span::styled("PageUp   ", theme::telemetry_value()),
            Span::styled("scroll up", theme::label()),
        ]),
        Line::from(vec![
            Span::styled("PageDn   ", theme::telemetry_value()),
            Span::styled("scroll dn", theme::label()),
        ]),
        Line::from(vec![
            Span::styled("End      ", theme::telemetry_value()),
            Span::styled("to bottom", theme::label()),
        ]),
        Line::from(vec![
            Span::styled("Ctrl+L   ", theme::telemetry_value()),
            Span::styled("clear", theme::label()),
        ]),
        Line::from(vec![
            Span::styled("Ctrl+C   ", theme::telemetry_value()),
            Span::styled("quit", theme::label()),
        ]),
        Line::from(vec![
            Span::styled("Esc      ", theme::telemetry_value()),
            Span::styled("dismiss", theme::label()),
        ]),
    ];

    let block = Block::default()
        .title(Span::styled(" KEYS ", theme::header_title()))
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(theme::border_inactive())
        .style(theme::base());

    let paragraph = Paragraph::new(lines).block(block);
    f.render_widget(paragraph, area);
}
