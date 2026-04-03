// ui/components/input.rs
//
// Input field renderer.
//
// The input field is a bordered pane with a status label and a text area
// showing the current input buffer.  The cursor is rendered as a Stapler Red
// reverse-video block at the cursor position, implemented by splitting the
// input string into three spans: before-cursor, cursor-char (or space if at
// end), and after-cursor.

use ratatui::{
    layout::Rect,
    text::{Line, Span},
    widgets::{Block, BorderType, Borders, Paragraph, Wrap},
    Frame,
};

use crate::app::state::{AppMode, AppState};
use crate::ui::theme;

/// Render the input field.
pub fn render(f: &mut Frame, area: Rect, state: &AppState) {
    let is_active = state.mode == AppMode::Normal;

    let border_style = if is_active {
        theme::border_active()
    } else {
        theme::border_inactive()
    };

    let hint = if state.mode == AppMode::Streaming {
        Span::styled(" Streaming... ", theme::pulse())
    } else {
        Span::styled(" Enter message -- Press Enter to send ", theme::dimmed())
    };

    let block = Block::default()
        .title(hint)
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(border_style)
        .style(theme::base());

    // Build the three-segment cursor display.
    let display_lines = build_cursor_display(state);

    let paragraph = Paragraph::new(display_lines)
        .block(block)
        .wrap(Wrap { trim: false });

    f.render_widget(paragraph, area);
}

/// Split the input buffer into [before_cursor, cursor_char, after_cursor] spans
/// and assemble them into Lines for display.
fn build_cursor_display(state: &AppState) -> Vec<Line<'_>> {
    let input = &state.input;
    let pos = state.cursor_pos;
    let is_active = state.mode == AppMode::Normal;

    if !is_active {
        // While streaming, show the committed text without a cursor.
        return vec![Line::from(Span::styled(
            format!(" {}", input.as_str()),
            theme::dimmed(),
        ))];
    }

    if input.is_empty() {
        // Render a placeholder cursor on empty input.
        return vec![Line::from(vec![
            Span::raw(" "),
            Span::styled(" ", theme::cursor()),
        ])];
    }

    let before = &input[..pos];
    let (cursor_char, after) = if pos < input.len() {
        // Find the end of the character at `pos`.
        let next = next_char_boundary(input, pos);
        (&input[pos..next], &input[next..])
    } else {
        // Cursor is at end: render a space block.
        ("", "")
    };

    let mut spans: Vec<Span> = Vec::new();
    spans.push(Span::raw(" "));
    if !before.is_empty() {
        spans.push(Span::styled(before.to_string(), theme::base()));
    }
    if !cursor_char.is_empty() {
        spans.push(Span::styled(cursor_char.to_string(), theme::cursor()));
    } else {
        // Cursor at end of input.
        spans.push(Span::styled(" ", theme::cursor()));
    }
    if !after.is_empty() {
        spans.push(Span::styled(after.to_string(), theme::base()));
    }

    vec![Line::from(spans)]
}

fn next_char_boundary(s: &str, pos: usize) -> usize {
    let mut p = pos + 1;
    while p < s.len() && !s.is_char_boundary(p) {
        p += 1;
    }
    p
}
