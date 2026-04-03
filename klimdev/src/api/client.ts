// NVIDIA NIM API client.
// Wraps fetch() calls to the NIM OpenAI-compatible endpoint.
// All requests require an API key set via NVIDIA_API_KEY env var or config.

import { ChatMessage, ChatCompletionRequest, StreamEvent } from "./types.js";
import { parseSSEStream } from "./streaming.js";

const NIM_BASE_URL = "https://integrate.api.nvidia.com/v1";

export interface ClientOptions {
  apiKey: string;
  modelId: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export class NimClient {
  private apiKey: string;
  private modelId: string;
  private temperature: number;
  private maxTokens: number;
  private systemPrompt: string;

  constructor(opts: ClientOptions) {
    this.apiKey = opts.apiKey;
    this.modelId = opts.modelId;
    this.temperature = opts.temperature ?? 0.6;
    this.maxTokens = opts.maxTokens ?? 2048;
    this.systemPrompt =
      opts.systemPrompt ??
      "You are KlimDev, an expert AI coding assistant. Be concise, precise, and helpful.";
  }

  // Sends a streaming chat completion request and returns an async generator
  // that yields StreamEvents (tokens, done, or error).
  async *streamChat(
    conversationHistory: ChatMessage[]
  ): AsyncGenerator<StreamEvent> {
    const messages: ChatMessage[] = [
      { role: "system", content: this.systemPrompt },
      ...conversationHistory,
    ];

    const body: ChatCompletionRequest = {
      model: this.modelId,
      messages,
      stream: true,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    };

    const startedAt = Date.now();

    let response: Response;
    try {
      response = await fetch(`${NIM_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "text/event-stream",
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      yield { type: "error", message: `Network error: ${message}` };
      return;
    }

    if (!response.ok) {
      let detail = "";
      try {
        const text = await response.text();
        detail = text.slice(0, 200);
      } catch {
        // ignore
      }
      yield {
        type: "error",
        message: `NIM API error ${response.status}: ${detail}`,
      };
      return;
    }

    if (!response.body) {
      yield { type: "error", message: "Empty response body from NIM API" };
      return;
    }

    yield* parseSSEStream(response.body, startedAt);
  }

  setModel(modelId: string) {
    this.modelId = modelId;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }
}
