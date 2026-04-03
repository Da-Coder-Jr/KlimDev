// ui/theme.rs
//
#![allow(dead_code)]
//
// Centralised colour and style palette.
//
// The visual identity of KlimDev TUI is built around two anchor colours:
//   - Vantablack (#050505): near-total-absorption background.
//   - Stapler Red (#FF0033): high-contrast accent for borders, headers, labels.
//
// All component renderers import their styles from this module, ensuring that
// a single constant change propagates across the entire UI instantaneously.

use ratatui::style::{Color, Modifier, Style};

// ---------------------------------------------------------------------------
// Raw colour constants
// ---------------------------------------------------------------------------

/// Vantablack -- primary background.
pub const COL_BG: Color = Color::Rgb(5, 5, 5);

/// Near-black -- slightly elevated surface (input box, sidebar bg).
pub const COL_BG_ELEVATED: Color = Color::Rgb(12, 12, 12);

/// Panel background -- header, inactive pane backgrounds.
pub const COL_BG_PANEL: Color = Color::Rgb(18, 18, 18);

/// Stapler Red -- primary accent: active borders, titles, highlights.
pub const COL_ACCENT: Color = Color::Rgb(255, 0, 51);

/// Deep red -- secondary accent for dimmed highlights.
pub const COL_ACCENT_DIM: Color = Color::Rgb(160, 0, 32);

/// Off-white -- primary foreground text.
pub const COL_FG: Color = Color::Rgb(224, 224, 224);

/// Mid-grey -- secondary / dimmed text.
pub const COL_FG_DIM: Color = Color::Rgb(110, 110, 110);

/// Dark-grey -- inactive border.
pub const COL_BORDER_INACTIVE: Color = Color::Rgb(42, 42, 42);

/// Soft teal -- user message accent.
pub const COL_USER: Color = Color::Rgb(0, 200, 180);

/// Muted amber -- assistant message accent.
pub const COL_ASSISTANT: Color = Color::Rgb(255, 180, 0);

/// Success green.
pub const COL_SUCCESS: Color = Color::Rgb(0, 220, 110);

/// Warning amber.
pub const COL_WARNING: Color = Color::Rgb(255, 170, 0);

/// Error red (distinct from accent to signal failure).
pub const COL_ERROR: Color = Color::Rgb(255, 68, 68);

/// Streaming indicator pulse colour.
pub const COL_PULSE: Color = Color::Rgb(255, 80, 80);

// ---------------------------------------------------------------------------
// Composed style helpers
// ---------------------------------------------------------------------------

/// Base style: white text on Vantablack background.
pub fn base() -> Style {
    Style::default().fg(COL_FG).bg(COL_BG)
}

/// Active border style.
pub fn border_active() -> Style {
    Style::default().fg(COL_ACCENT).bg(COL_BG)
}

/// Inactive border style.
pub fn border_inactive() -> Style {
    Style::default().fg(COL_BORDER_INACTIVE).bg(COL_BG)
}

/// Header title style.
pub fn header_title() -> Style {
    Style::default()
        .fg(COL_ACCENT)
        .bg(COL_BG_PANEL)
        .add_modifier(Modifier::BOLD)
}

/// Subtitle / label style.
pub fn label() -> Style {
    Style::default().fg(COL_FG_DIM).bg(COL_BG)
}

/// User message header.
pub fn user_header() -> Style {
    Style::default()
        .fg(COL_USER)
        .bg(COL_BG)
        .add_modifier(Modifier::BOLD)
}

/// Assistant message header.
pub fn assistant_header() -> Style {
    Style::default()
        .fg(COL_ASSISTANT)
        .bg(COL_BG)
        .add_modifier(Modifier::BOLD)
}

/// Message body text.
pub fn message_body() -> Style {
    Style::default().fg(COL_FG).bg(COL_BG)
}

/// Error text.
pub fn error() -> Style {
    Style::default()
        .fg(COL_ERROR)
        .bg(COL_BG)
        .add_modifier(Modifier::BOLD)
}

/// Success text.
pub fn success() -> Style {
    Style::default().fg(COL_SUCCESS).bg(COL_BG)
}

/// Warning text.
pub fn warning() -> Style {
    Style::default().fg(COL_WARNING).bg(COL_BG)
}

/// Highlighted / selected item.
pub fn highlight() -> Style {
    Style::default()
        .fg(COL_BG)
        .bg(COL_ACCENT)
        .add_modifier(Modifier::BOLD)
}

/// Streaming pulse indicator.
pub fn pulse() -> Style {
    Style::default()
        .fg(COL_PULSE)
        .bg(COL_BG)
        .add_modifier(Modifier::BOLD | Modifier::RAPID_BLINK)
}

/// Telemetry value style.
pub fn telemetry_value() -> Style {
    Style::default()
        .fg(COL_ACCENT)
        .bg(COL_BG)
        .add_modifier(Modifier::BOLD)
}

/// Telemetry key style.
pub fn telemetry_key() -> Style {
    Style::default().fg(COL_FG_DIM).bg(COL_BG)
}

/// Cursor style for the input field.
pub fn cursor() -> Style {
    Style::default()
        .fg(COL_BG)
        .bg(COL_ACCENT)
        .add_modifier(Modifier::BOLD)
}

/// Dimmed text.
pub fn dimmed() -> Style {
    Style::default().fg(COL_FG_DIM).bg(COL_BG)
}
