// Server-sent event (SSE) stream parser for NVIDIA NIM chat completions.
// Reads the raw Response body line by line, strips the `data: ` prefix,
// and emits StreamEvent objects through an async generator.

import { StreamChunk, StreamEvent, TokenUsage } from "./types.js";

// Takes a readable stream from fetch() and yields StreamEvent objects.
// The caller is responsible for providing the start timestamp for measuring duration.
export async function* parseSSEStream(
  body: ReadableStream<Uint8Array>,
  startedAt: number
): AsyncGenerator<StreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let usage: TokenUsage | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process all complete lines in the buffer
      const lines = buffer.split("\n");
      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) continue; // skip comments/blanks

        if (!trimmed.startsWith("data:")) continue;

        const payload = trimmed.slice(5).trim();

        if (payload === "[DONE]") {
          yield {
            type: "done",
            usage,
            durationMs: Date.now() - startedAt,
          };
          return;
        }

        let chunk: StreamChunk;
        try {
          chunk = JSON.parse(payload) as StreamChunk;
        } catch {
          // Malformed JSON — skip this line
          continue;
        }

        // Capture usage if the server includes it mid-stream
        if (chunk.usage) {
          usage = chunk.usage;
        }

        for (const choice of chunk.choices) {
          const content = choice.delta?.content;
          if (content) {
            yield { type: "token", content };
          }
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    yield { type: "error", message };
  } finally {
    reader.releaseLock();
  }
}
