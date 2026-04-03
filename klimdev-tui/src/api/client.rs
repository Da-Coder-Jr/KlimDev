// api/client.rs
//
// NimClient -- the high-level entry point for all communication with the
// NVIDIA NIM inference endpoint.
//
// Responsibilities:
//   - Own the reqwest::Client (connection pool, TLS, timeouts).
//   - Construct well-formed ChatRequest payloads from caller-supplied context.
//   - Spawn a background tokio task that drives the SSE stream and forwards
//     decoded events to the caller-supplied channel.
//
// The client is deliberately thin: it does not perform retries, rate-limit
// handling, or response caching.  Those concerns belong to higher layers.

use std::time::{Duration, Instant};

use anyhow::{Context, Result};
use tokio::sync::mpsc;

use crate::api::models::{ApiEvent, ChatMessage, ChatRequest};
use crate::api::streaming::drive_sse_stream;
use crate::config::Settings;

/// A cloneable HTTP client wrapper bound to a specific NIM deployment.
#[derive(Clone)]
pub struct NimClient {
    inner: reqwest::Client,
    base_url: String,
    api_key: String,
    model: String,
    max_tokens: u32,
    temperature: f32,
}

impl NimClient {
    /// Construct a new client from application settings.
    ///
    /// This call is synchronous and cheap: the underlying reqwest::Client
    /// is backed by a connection pool that is lazily populated on first use.
    pub fn new(settings: &Settings) -> Result<Self> {
        let inner = reqwest::Client::builder()
            .timeout(Duration::from_secs(settings.request_timeout_secs))
            .tcp_keepalive(Duration::from_secs(30))
            .build()
            .context("Failed to construct HTTP client")?;

        Ok(Self {
            inner,
            base_url: settings.api_base_url.clone(),
            api_key: settings.api_key.clone(),
            model: settings.model.clone(),
            max_tokens: settings.max_tokens,
            temperature: settings.temperature,
        })
    }

    /// Send a streaming chat completion request.
    ///
    /// This method:
    ///   1. Constructs and sends the HTTP POST request.
    ///   2. Spawns a detached tokio task that drives the SSE stream.
    ///   3. Returns immediately; the caller receives events via `tx`.
    ///
    /// The spawned task will send either `ApiEvent::StreamComplete` or
    /// `ApiEvent::StreamError` as its terminal event, guaranteeing that the
    /// channel is closed exactly once.
    pub async fn stream_chat(
        &self,
        messages: Vec<ChatMessage>,
        tx: mpsc::Sender<ApiEvent>,
    ) -> Result<()> {
        let request_body = ChatRequest {
            model: self.model.clone(),
            messages,
            stream: true,
            max_tokens: self.max_tokens,
            temperature: self.temperature,
        };

        let url = format!("{}/chat/completions", self.base_url);

        let response = self
            .inner
            .post(&url)
            .bearer_auth(&self.api_key)
            .header("Accept", "text/event-stream")
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await
            .context("HTTP request to NIM endpoint failed")?;

        // Propagate HTTP-level errors (4xx / 5xx) before entering the stream loop.
        let status = response.status();
        if !status.is_success() {
            let body = response.text().await.unwrap_or_default();
            let msg = format!("NIM API returned HTTP {status}: {body}");
            let _ = tx.send(ApiEvent::StreamError(msg.clone())).await;
            return Err(anyhow::anyhow!(msg));
        }

        // Record the wall-clock start so the streaming driver can compute
        // end-to-end latency.
        let request_start = Instant::now();

        // Spawn the stream driver as an independent task so the caller can
        // continue rendering the UI without blocking on I/O.
        tokio::spawn(async move {
            if let Err(e) = drive_sse_stream(response, tx.clone(), request_start).await {
                let _ = tx.send(ApiEvent::StreamError(e.to_string())).await;
            }
        });

        Ok(())
    }

    /// Returns the model name this client is configured for, for display.
    #[allow(dead_code)]
    pub fn model_name(&self) -> &str {
        &self.model
    }
}
