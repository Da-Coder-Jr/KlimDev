// ui/components/chat.rs
//
// Chat history renderer.
//
// This component converts the flat Vec<Message> in AppState into a ratatui
// Paragraph containing styled Lines.  The key design decisions:
//
//   - Every message is rendered as a two-part block: a one-line header
//     (role label + timestamp) followed by the content body.  A blank
//     separator line follows each block to give visual breathing room.
//
//   - The content body is word-wrapped to fit within the inner width of
//     the chat pane.  This is done manually using a simple greedy word-wrap
//     algorithm so we can apply per-line styles.
//
//   - Scroll is implemented by slicing the flat line list from the bottom:
//     scroll_offset=0 shows the very last `visible_height` lines.
//
//   - The streaming cursor (a blinking block) is appended to the last line
//     of the last assistant message while streaming is active.

use ratatui::{
    layout::Rect,
    text::{Line, Span},
    widgets::{Block, BorderType, Borders, Paragraph, Wrap},
    Frame,
};

use crate::app::state::{AppMode, AppState, Role};
use crate::ui::theme;

/// Render the scrollable chat history pane.
///
/// This function also updates `state.total_chat_lines` so the scroll logic
/// in AppState has an accurate line count.  Because `state` is passed as
/// `&AppState` (immutable) in the render path, we return the line count and
/// let the caller update it.  In practice, `main.rs` does:
///
///   let new_count = chat::line_count(&state, inner_width);
///   state.total_chat_lines = new_count;
pub fn render(f: &mut Frame, area: Rect, state: &AppState) {
    let is_streaming = state.mode == AppMode::Streaming;
    let border_style = if is_streaming {
        theme::border_active()
    } else {
        theme::border_inactive()
    };

    let block = Block::default()
        .title(Span::styled(" CONVERSATION ", theme::header_title()))
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(border_style)
        .style(theme::base());

    // The inner area is where text is actually drawn.
    let inner = block.inner(area);
    let wrap_width = inner.width.max(1) as usize;
    let visible_height = inner.height as usize;

    // Build the full flat line list.
    let all_lines = build_lines(state, wrap_width, is_streaming);
    let total = all_lines.len();

    // Compute the scroll window.
    // scroll_offset counts from the bottom; 0 = pinned to last line.
    let offset = state.scroll_offset as usize;
    let start = if total > visible_height {
        let bottom = total - offset.min(total);
        bottom.saturating_sub(visible_height)
    } else {
        0
    };

    let visible: Vec<Line> = all_lines
        .into_iter()
        .skip(start)
        .take(visible_height)
        .collect();

    let paragraph = Paragraph::new(visible)
        .block(block)
        .wrap(Wrap { trim: false });

    f.render_widget(paragraph, area);
}

/// Build the complete list of styled Lines for all messages.
fn build_lines<'a>(state: &'a AppState, wrap_width: usize, is_streaming: bool) -> Vec<Line<'a>> {
    let mut lines: Vec<Line<'a>> = Vec::new();

    if state.messages.is_empty() {
        lines.push(Line::from(Span::styled(
            "  Type a message below and press Enter to begin.",
            theme::dimmed(),
        )));
        return lines;
    }

    let msg_count = state.messages.len();
    for (idx, msg) in state.messages.iter().enumerate() {
        let is_last = idx == msg_count - 1;

        // Skip system messages from the display.
        if msg.role == Role::System {
            continue;
        }

        // ---- Header line ----
        let (role_label, header_style) = match msg.role {
            Role::User => ("USER", theme::user_header()),
            Role::Assistant => ("ASSISTANT", theme::assistant_header()),
            Role::System => continue,
        };

        let timestamp = msg.timestamp.format("%H:%M:%S").to_string();
        let header_line = Line::from(vec![
            Span::styled(format!(" {role_label} "), header_style),
            Span::styled(format!(" {timestamp} "), theme::dimmed()),
        ]);
        lines.push(header_line);

        // ---- Content body ----
        let content = &msg.content;

        if content.is_empty() && is_last && is_streaming {
            // Empty placeholder during stream start -- show a waiting cursor.
            lines.push(Line::from(Span::styled(" >>", theme::pulse())));
        } else {
            let content_lines = wrap_text(content, wrap_width);
            let content_count = content_lines.len();

            for (cidx, text_line) in content_lines.into_iter().enumerate() {
                let is_last_content = cidx == content_count - 1;

                if is_last && is_streaming && is_last_content {
                    // Append streaming cursor to the final line in flight.
                    let mut spans = vec![Span::styled(
                        format!(" {text_line}"),
                        theme::message_body(),
                    )];
                    spans.push(Span::styled(" |", theme::pulse()));
                    lines.push(Line::from(spans));
                } else {
                    lines.push(Line::from(Span::styled(
                        format!(" {text_line}"),
                        theme::message_body(),
                    )));
                }
            }
        }

        // Blank separator between messages.
        lines.push(Line::from(""));
    }

    lines
}

/// Greedy word-wrap: split `text` into lines of at most `width` visible
/// characters.  Existing newlines in the text are honoured.
fn wrap_text(text: &str, width: usize) -> Vec<String> {
    if width == 0 {
        return vec![text.to_string()];
    }

    let mut result = Vec::new();

    for paragraph in text.split('\n') {
        if paragraph.is_empty() {
            result.push(String::new());
            continue;
        }

        let mut current_line = String::new();
        let mut current_width = 0usize;

        for word in paragraph.split_whitespace() {
            let word_len = word.chars().count();

            if current_line.is_empty() {
                // First word on a new line -- always place it, even if it exceeds width.
                current_line.push_str(word);
                current_width = word_len;
            } else if current_width + 1 + word_len <= width {
                current_line.push(' ');
                current_line.push_str(word);
                current_width += 1 + word_len;
            } else {
                result.push(current_line.clone());
                current_line.clear();
                current_line.push_str(word);
                current_width = word_len;
            }
        }

        if !current_line.is_empty() {
            result.push(current_line);
        }
    }

    if result.is_empty() {
        result.push(String::new());
    }

    result
}
