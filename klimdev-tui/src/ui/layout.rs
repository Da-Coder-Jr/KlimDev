// ui/layout.rs
//
// Layout engine for the KlimDev TUI.
//
// The terminal surface is divided into a fixed set of named rectangular areas.
// Every component renderer is handed exactly one Rect from this module; it
// never computes its own position.  This makes the layout a single,
// auditable point of change for spatial concerns.
//
// Layout diagram (approximate proportions, not to scale):
//
//  +-----------------------------------------------------------------+
//  |                      HEADER (3 lines)                           |
//  +------------+----------------------------------+-----------------+
//  |            |                                  |                 |
//  |  SIDEBAR   |       CHAT   (scrollable)        |   TELEMETRY     |
//  |  (22 cols) |                                  |   (28 cols)     |
//  |            |                                  |                 |
//  |            +----------------------------------+                 |
//  |            |       INPUT  (5 lines)           |                 |
//  +------------+----------------------------------+-----------------+
//  |                    STATUS BAR (1 line)                          |
//  +-----------------------------------------------------------------+

use ratatui::layout::{Constraint, Direction, Layout, Rect};

/// Named areas produced by the layout engine.
#[derive(Debug, Clone, Copy)]
pub struct Areas {
    pub header: Rect,
    pub sidebar: Rect,
    pub chat: Rect,
    pub input: Rect,
    pub telemetry: Rect,
    pub statusbar: Rect,
}

/// Compute all pane areas from the terminal's full surface rectangle.
///
/// Called once per frame before any rendering.  The computation is pure and
/// allocation-free (ratatui Layout uses stack-allocated arrays internally).
pub fn compute(frame_area: Rect) -> Areas {
    // ---- Outer vertical split: header / body / statusbar ----
    let outer = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(3),      // header
            Constraint::Min(10),        // body
            Constraint::Length(1),      // statusbar
        ])
        .split(frame_area);

    let header_area = outer[0];
    let body_area = outer[1];
    let statusbar_area = outer[2];

    // ---- Body horizontal split: sidebar / center / telemetry ----
    let body_cols = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Length(22),     // sidebar
            Constraint::Min(40),        // center (chat + input)
            Constraint::Length(28),     // telemetry
        ])
        .split(body_area);

    let sidebar_area = body_cols[0];
    let center_area = body_cols[1];
    let telemetry_area = body_cols[2];

    // ---- Center vertical split: chat / input ----
    let center_rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Min(5),         // chat (expands to fill space)
            Constraint::Length(5),      // input (fixed height)
        ])
        .split(center_area);

    let chat_area = center_rows[0];
    let input_area = center_rows[1];

    Areas {
        header: header_area,
        sidebar: sidebar_area,
        chat: chat_area,
        input: input_area,
        telemetry: telemetry_area,
        statusbar: statusbar_area,
    }
}
