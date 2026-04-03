// ui/mod.rs
//
// Root of the UI subsystem.
//
// The single public entry point is `render`, which takes an immutable
// reference to AppState and a mutable ratatui Frame.  It orchestrates the
// layout engine and delegates to each component module in z-order (back to
// front, though ratatui renders each widget independently without compositing).

pub mod components;
pub mod layout;
pub mod theme;

use ratatui::Frame;

use crate::app::state::AppState;

/// Top-level render function.  Called once per tick from the main event loop.
///
/// The render pipeline is:
///   1. Compute all pane areas from the frame's total size.
///   2. Fill the frame background with the Vantablack base style.
///   3. Render each component into its designated area.
///
/// This function is deliberately free of logic -- it only coordinates spatial
/// layout and component dispatch.
pub fn render(f: &mut Frame, state: &AppState) {
    let areas = layout::compute(f.area());

    // Fill the background of the entire frame so no terminal default colours
    // bleed through in areas between widgets.
    f.render_widget(
        ratatui::widgets::Block::default().style(theme::base()),
        f.area(),
    );

    components::header::render(f, areas.header, state);
    components::sidebar::render(f, areas.sidebar, state);
    components::chat::render(f, areas.chat, state);
    components::input::render(f, areas.input, state);
    components::telemetry::render(f, areas.telemetry, state);
    components::statusbar::render(f, areas.statusbar, state);
}
