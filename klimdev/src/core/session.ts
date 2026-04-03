// Active session state machine.
// Manages the lifecycle of a chat session — messages, streaming state,
// token counters, and error handling.

import { ChatMessage, StreamEvent, TokenUsage } from "../api/types.js";
import { NimClient } from "../api/client.js";
import { getConfig } from "../config/index.js";

export type SessionStatus = "idle" | "streaming" | "error";

export interface SessionState {
  id: string;
  messages: ChatMessage[];
  status: SessionStatus;
  streamingContent: string;
  lastError: string | null;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  requestCount: number;
  lastDurationMs: number;
  tokensPerSecond: number;
}

export function makeInitialState(id: string): SessionState {
  return {
    id,
    messages: [],
    status: "idle",
    streamingContent: "",
    lastError: null,
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    requestCount: 0,
    lastDurationMs: 0,
    tokensPerSecond: 0,
  };
}

// Runs a streaming chat request and calls the provided callbacks as events arrive.
// Returns when the stream is complete or an error occurs.
export async function runStreamingChat(
  state: SessionState,
  userMessage: string,
  callbacks: {
    onToken: (token: string) => void;
    onDone: (usage: TokenUsage | null, durationMs: number) => void;
    onError: (message: string) => void;
  }
): Promise<void> {
  const config = getConfig();

  if (!config.apiKey) {
    callbacks.onError(
      "No NVIDIA API key set. Run `klimdev config set-key <key>` or set NVIDIA_API_KEY env var."
    );
    return;
  }

  const client = new NimClient({
    apiKey: config.apiKey,
    modelId: config.modelId,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    systemPrompt: config.systemPrompt,
  });

  const history: ChatMessage[] = [
    ...state.messages,
    { role: "user", content: userMessage },
  ];

  for await (const event of client.streamChat(history)) {
    switch (event.type) {
      case "token":
        callbacks.onToken(event.content);
        break;
      case "done":
        callbacks.onDone(event.usage, event.durationMs);
        return;
      case "error":
        callbacks.onError(event.message);
        return;
    }
  }
}
