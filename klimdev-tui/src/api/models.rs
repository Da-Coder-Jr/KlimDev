// api/models.rs
//
// Serde-annotated types that mirror the OpenAI-compatible JSON schema used by
// NVIDIA NIM.  These structures cover both the outbound chat request and every
// inbound SSE chunk format, including the terminal [DONE] sentinel.

use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Outbound request types
// ---------------------------------------------------------------------------

/// A single message in the conversation context array.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    /// "system", "user", or "assistant"
    pub role: String,
    pub content: String,
}

impl ChatMessage {
    #[allow(dead_code)]
    pub fn system(content: impl Into<String>) -> Self {
        Self { role: "system".to_string(), content: content.into() }
    }

    #[allow(dead_code)]
    pub fn user(content: impl Into<String>) -> Self {
        Self { role: "user".to_string(), content: content.into() }
    }

    #[allow(dead_code)]
    pub fn assistant(content: impl Into<String>) -> Self {
        Self { role: "assistant".to_string(), content: content.into() }
    }
}

/// Full chat completion request body sent to the NIM endpoint.
#[derive(Debug, Serialize)]
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub stream: bool,
    pub max_tokens: u32,
    pub temperature: f32,
}

// ---------------------------------------------------------------------------
// Inbound streaming response types (SSE)
// ---------------------------------------------------------------------------

/// Top-level chunk received over the SSE stream for each `data:` line.
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct StreamChunk {
    pub id: Option<String>,
    pub object: Option<String>,
    pub model: Option<String>,
    pub choices: Vec<StreamChoice>,
    /// Present on the final non-[DONE] chunk when the model finishes.
    pub usage: Option<UsageStats>,
}

/// One element within the `choices` array of a streaming chunk.
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct StreamChoice {
    pub index: u32,
    pub delta: Delta,
    pub finish_reason: Option<String>,
}

/// Incremental content delta within a streaming choice.
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct Delta {
    /// The role field is only present on the very first chunk.
    pub role: Option<String>,
    /// The token text.  May be None on first/last administrative chunks.
    pub content: Option<String>,
}

/// Token usage statistics returned on the final stream chunk (if requested).
#[derive(Debug, Deserialize, Clone, Default)]
#[allow(dead_code)]
pub struct UsageStats {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

// ---------------------------------------------------------------------------
// Internal event type passed through the tokio channel
// ---------------------------------------------------------------------------

/// Events emitted by the streaming task and consumed by the UI event loop.
#[derive(Debug)]
pub enum ApiEvent {
    /// A token fragment has arrived; append it to the current response.
    Token(String),

    /// The stream has terminated successfully.
    StreamComplete {
        usage: Option<UsageStats>,
        /// Wall-clock milliseconds from request dispatch to stream end.
        total_ms: u128,
    },

    /// An unrecoverable error occurred during the API call.
    StreamError(String),
}
