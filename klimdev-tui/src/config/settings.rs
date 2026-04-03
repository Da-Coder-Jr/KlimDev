// config/settings.rs
//
// Centralised configuration management.  All runtime parameters are read once
// at startup from environment variables, with safe defaults where applicable.
// This avoids scattered `std::env::var` calls throughout the codebase and
// makes the configuration surface explicit and testable.

use anyhow::{anyhow, Result};

/// Top-level application configuration, constructed at startup.
#[derive(Debug, Clone)]
pub struct Settings {
    /// NVIDIA NIM API key (required).  Set via NVIDIA_NIM_API_KEY.
    pub api_key: String,

    /// Base URL for the NIM OpenAI-compatible endpoint.
    pub api_base_url: String,

    /// Model identifier to request from NIM.
    pub model: String,

    /// Maximum tokens the model should generate per response.
    pub max_tokens: u32,

    /// Sampling temperature (0.0 – 1.0).
    pub temperature: f32,

    /// Maximum number of messages retained in context before truncation.
    pub context_window_messages: usize,

    /// HTTP request timeout in seconds.
    pub request_timeout_secs: u64,
}

impl Settings {
    /// Construct settings by reading environment variables.
    /// Returns an error if any required variable is absent or malformed.
    pub fn from_env() -> Result<Self> {
        let api_key = std::env::var("NVIDIA_NIM_API_KEY")
            .map_err(|_| anyhow!("NVIDIA_NIM_API_KEY environment variable is not set.\n\
                                  Export it before launching: export NVIDIA_NIM_API_KEY=nvapi-..."))?;

        let api_base_url = std::env::var("NIM_BASE_URL")
            .unwrap_or_else(|_| "https://integrate.api.nvidia.com/v1".to_string());

        let model = std::env::var("NIM_MODEL")
            .unwrap_or_else(|_| "meta/llama-3.1-70b-instruct".to_string());

        let max_tokens = std::env::var("NIM_MAX_TOKENS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(2048u32);

        let temperature = std::env::var("NIM_TEMPERATURE")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(0.7f32);

        let context_window_messages = std::env::var("NIM_CONTEXT_MESSAGES")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(20usize);

        let request_timeout_secs = std::env::var("NIM_TIMEOUT_SECS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(120u64);

        Ok(Self {
            api_key,
            api_base_url,
            model,
            max_tokens,
            temperature,
            context_window_messages,
            request_timeout_secs,
        })
    }
}
