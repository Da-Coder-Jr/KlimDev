// app/actions.rs
//
// The Action enum is the single vocabulary of mutations that the application
// accepts.  Every terminal key event and every API event is translated into an
// Action before being handled by AppState::apply.  This strict separation
// between "what happened" (events) and "what to do" (actions) makes the state
// machine straightforward to reason about and extend.

/// All operations that can mutate application state.
#[derive(Debug)]
pub enum Action {
    // ---- Input management ----

    /// Insert a character at the current cursor position.
    InputChar(char),

    /// Delete the character immediately before the cursor (backspace semantics).
    InputBackspace,

    /// Delete the character immediately after the cursor (delete semantics).
    InputDelete,

    /// Move the cursor one grapheme to the left.
    CursorLeft,

    /// Move the cursor one grapheme to the right.
    CursorRight,

    /// Jump the cursor to the beginning of the input field.
    CursorHome,

    /// Jump the cursor to the end of the input field.
    CursorEnd,

    // ---- Submission ----

    /// Finalise the current input field content and send it to the API.
    SubmitInput,

    // ---- Streaming lifecycle ----

    /// Append a token fragment to the in-progress assistant response.
    AppendToken(String),

    /// The current stream has completed cleanly.
    StreamDone {
        total_ms: u128,
        prompt_tokens: u32,
        completion_tokens: u32,
    },

    /// The current stream has terminated with an error.
    StreamError(String),

    // ---- Viewport navigation ----

    /// Scroll the chat viewport up by one page.
    ScrollUp,

    /// Scroll the chat viewport down by one page.
    ScrollDown,

    /// Jump to the bottom of the chat history.
    ScrollBottom,

    // ---- Mode switching ----

    /// Toggle between Normal mode and a potential future command mode.
    #[allow(dead_code)]
    ToggleCommandMode,

    // ---- Application lifecycle ----

    /// Gracefully terminate the application.
    Quit,

    /// Clear the current error banner.
    DismissError,

    /// Reset the conversation, clearing all messages.
    ClearConversation,
}
