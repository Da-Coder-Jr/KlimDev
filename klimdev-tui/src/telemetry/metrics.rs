// telemetry/metrics.rs
//
// Real-time telemetry for the TUI.
//
// TelemetryMetrics is updated atomically during each streaming session and
// rendered in the right-hand telemetry panel.  All timing values are in
// milliseconds to keep the arithmetic cheap in the hot render path.

use std::time::Instant;

/// Accumulated metrics for the current and lifetime sessions.
#[derive(Debug, Clone, Default)]
pub struct TelemetryMetrics {
    // ---- Current stream ----

    /// Wall-clock time when the current request was dispatched.
    pub request_start: Option<Instant>,

    /// Wall-clock time when the first token arrived (time-to-first-token).
    pub first_token_at: Option<Instant>,

    /// Number of tokens received in the current streaming response.
    pub current_tokens: u32,

    // ---- Completed stream snapshot ----

    /// TTFT for the last completed stream (ms).
    pub last_ttft_ms: Option<u128>,

    /// Total wall-clock duration for the last completed stream (ms).
    pub last_total_ms: Option<u128>,

    /// Tokens-per-second for the last completed stream.
    pub last_tps: Option<f64>,

    /// Prompt tokens consumed in the last completed request.
    pub last_prompt_tokens: u32,

    /// Completion tokens generated in the last completed response.
    pub last_completion_tokens: u32,

    // ---- Lifetime counters ----

    /// Total number of user messages sent across all turns.
    pub total_user_turns: u32,

    /// Total tokens generated across all turns.
    pub total_tokens_generated: u32,

    /// Total number of completed (non-error) streams.
    pub total_successful_streams: u32,

    /// Total number of failed streams.
    pub total_failed_streams: u32,
}

impl TelemetryMetrics {
    /// Call immediately before dispatching a new API request.
    pub fn on_request_start(&mut self) {
        self.request_start = Some(Instant::now());
        self.first_token_at = None;
        self.current_tokens = 0;
        self.total_user_turns += 1;
    }

    /// Call each time a token fragment arrives from the stream.
    pub fn on_token_received(&mut self) {
        if self.first_token_at.is_none() {
            self.first_token_at = Some(Instant::now());
            if let Some(start) = self.request_start {
                self.last_ttft_ms = Some(start.elapsed().as_millis());
            }
        }
        self.current_tokens += 1;
        self.total_tokens_generated += 1;
    }

    /// Call when the stream terminates successfully.
    pub fn on_stream_complete(
        &mut self,
        total_ms: u128,
        prompt_tokens: u32,
        completion_tokens: u32,
    ) {
        self.last_total_ms = Some(total_ms);
        self.last_prompt_tokens = prompt_tokens;
        self.last_completion_tokens = completion_tokens;

        // Compute tokens-per-second from the generation window
        // (total time minus TTFT gives us the generation phase duration).
        if let Some(ttft) = self.last_ttft_ms {
            let gen_ms = total_ms.saturating_sub(ttft);
            if gen_ms > 0 && self.current_tokens > 1 {
                self.last_tps = Some((self.current_tokens as f64 - 1.0) / (gen_ms as f64 / 1000.0));
            }
        }

        self.total_successful_streams += 1;
    }

    /// Call when the stream terminates with an error.
    pub fn on_stream_error(&mut self) {
        self.total_failed_streams += 1;
    }

    /// Returns the elapsed milliseconds since the current request started,
    /// or None if no request is in flight.
    pub fn elapsed_ms(&self) -> Option<u128> {
        self.request_start.map(|s| s.elapsed().as_millis())
    }

    /// Returns the live tokens-per-second estimate for the current stream,
    /// computed from the generation window so far.
    pub fn live_tps(&self) -> Option<f64> {
        let first_token = self.first_token_at?;
        let gen_ms = first_token.elapsed().as_millis();
        if gen_ms == 0 || self.current_tokens < 2 {
            return None;
        }
        Some((self.current_tokens as f64 - 1.0) / (gen_ms as f64 / 1000.0))
    }
}
