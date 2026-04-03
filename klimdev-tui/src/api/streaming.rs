// api/streaming.rs
//
// Low-level SSE parser and streaming loop.
//
// NVIDIA NIM (and OpenAI-compatible endpoints) send responses as a sequence of
// Server-Sent Events over a chunked HTTP response body.  Each event has the
// form:
//
//   data: <JSON payload>\n\n
//
// The final event is the sentinel:
//
//   data: [DONE]\n\n
//
// This module owns the byte-level responsibility of:
//   1. Accumulating raw bytes from the reqwest BytesStream into a line buffer.
//   2. Splitting on newlines to extract complete SSE lines.
//   3. Stripping the "data: " prefix and dispatching to the JSON deserialiser.
//   4. Forwarding decoded tokens and lifecycle events over a tokio mpsc channel.
//
// The caller (NimClient::stream_chat) spawns this logic in a dedicated tokio
// task so the UI event loop is never blocked.

use anyhow::Result;
use futures_util::StreamExt;
use reqwest::Response;
use std::time::Instant;
use tokio::sync::mpsc;

use crate::api::models::{ApiEvent, StreamChunk};

/// Prefix that identifies a data line in the SSE protocol.
const SSE_DATA_PREFIX: &str = "data: ";

/// The terminal sentinel value that signals stream completion.
const SSE_DONE_SENTINEL: &str = "[DONE]";

/// Drive the SSE response to completion, forwarding all events to `tx`.
///
/// # Design notes
/// - We maintain a rolling `line_buf` that accumulates bytes until a newline
///   is found, to handle the case where a single chunk spans multiple SSE
///   events or where an event is split across multiple HTTP chunks.
/// - Usage stats (if returned by the model) are extracted from the final
///   content chunk and forwarded alongside `StreamComplete`.
/// - Any JSON parse error is treated as a soft warning (the line is skipped)
///   rather than a fatal error, matching the behaviour of production clients.
pub async fn drive_sse_stream(
    response: Response,
    tx: mpsc::Sender<ApiEvent>,
    request_start: Instant,
) -> Result<()> {
    let mut byte_stream = response.bytes_stream();
    let mut line_buf = String::with_capacity(4096);
    let mut last_usage = None;

    'outer: while let Some(chunk_result) = byte_stream.next().await {
        let bytes = match chunk_result {
            Ok(b) => b,
            Err(e) => {
                let _ = tx.send(ApiEvent::StreamError(format!("Network read error: {e}"))).await;
                return Err(e.into());
            }
        };

        // Append decoded bytes to the rolling line buffer.
        // We use lossy conversion so a malformed UTF-8 sequence in a single
        // chunk does not abort the entire stream.
        line_buf.push_str(&String::from_utf8_lossy(&bytes));

        // Process every complete line present in the buffer.
        loop {
            // Find the next newline.
            let newline_pos = match line_buf.find('\n') {
                Some(pos) => pos,
                None => break, // Incomplete line -- wait for more bytes.
            };

            // Extract and remove the line (including the '\n') from the buffer.
            let raw_line = line_buf[..newline_pos].trim_end_matches('\r').to_string();
            line_buf.drain(..=newline_pos);

            // Skip blank lines (SSE uses blank lines as event separators).
            if raw_line.is_empty() {
                continue;
            }

            // Only process data lines; ignore comment lines (starting with ':').
            if !raw_line.starts_with(SSE_DATA_PREFIX) {
                continue;
            }

            let payload = &raw_line[SSE_DATA_PREFIX.len()..];

            // Handle the terminal sentinel.
            if payload == SSE_DONE_SENTINEL {
                let total_ms = request_start.elapsed().as_millis();
                let _ = tx.send(ApiEvent::StreamComplete {
                    usage: last_usage,
                    total_ms,
                }).await;
                break 'outer;
            }

            // Deserialise the JSON chunk.
            match serde_json::from_str::<StreamChunk>(payload) {
                Ok(chunk) => {
                    // Capture usage stats from the last chunk that includes them.
                    if chunk.usage.is_some() {
                        last_usage = chunk.usage.clone();
                    }

                    // Forward every non-empty token fragment.
                    for choice in &chunk.choices {
                        if let Some(content) = &choice.delta.content {
                            if !content.is_empty() {
                                if tx.send(ApiEvent::Token(content.clone())).await.is_err() {
                                    // Receiver has been dropped; abort silently.
                                    break 'outer;
                                }
                            }
                        }
                    }
                }
                Err(_) => {
                    // Non-fatal: skip unparseable lines (e.g., keep-alive pings).
                    continue;
                }
            }
        }
    }

    Ok(())
}
