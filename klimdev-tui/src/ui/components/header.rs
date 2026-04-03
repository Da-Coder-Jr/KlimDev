// ui/components/header.rs
//
// Top header bar: application identity, model name, and mode indicator.

use ratatui::{
    layout::Alignment,
    style::Modifier,
    text::{Line, Span},
    widgets::{Block, BorderType, Borders, Paragraph},
    Frame,
};
use ratatui::layout::Rect;

use crate::app::state::{AppMode, AppState};
use crate::ui::theme;

/// Render the full-width header bar.
pub fn render(f: &mut Frame, area: Rect, state: &AppState) {
    let mode_label = match state.mode {
        AppMode::Normal => Span::styled(" READY ", theme::success()),
        AppMode::Streaming => Span::styled(" STREAMING ", theme::pulse()),
        AppMode::Quitting => Span::styled(" QUITTING ", theme::error()),
    };

    let model_span = Span::styled(
        format!(" {} ", state.model_name),
        theme::label(),
    );

    let title_span = Span::styled(
        " KLIMDEV AI TERMINAL ",
        theme::header_title().add_modifier(Modifier::BOLD),
    );

    let separator = Span::styled(" | ", theme::dimmed());

    let line = Line::from(vec![
        title_span,
        separator.clone(),
        Span::styled("MODEL: ", theme::label()),
        model_span,
        separator,
        Span::styled("STATUS: ", theme::label()),
        mode_label,
    ]);

    let block = Block::default()
        .borders(Borders::ALL)
        .border_type(BorderType::Double)
        .border_style(theme::border_active())
        .style(theme::base());

    let paragraph = Paragraph::new(line)
        .block(block)
        .alignment(Alignment::Left);

    f.render_widget(paragraph, area);
}
