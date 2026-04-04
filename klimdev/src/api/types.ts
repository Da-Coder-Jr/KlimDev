// API types for the NVIDIA NIM chat completion API
// Uses the OpenAI-compatible schema that NIM exposes

export type MessageRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

// A single token delta arriving in a streaming response
export interface StreamDelta {
  role?: MessageRole;
  content?: string;
}

export interface StreamChoice {
  index: number;
  delta: StreamDelta;
  finish_reason: string | null;
}

export interface StreamChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: StreamChoice[];
  usage?: TokenUsage;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// Events emitted while a chat stream is in progress
export type StreamEvent =
  | { type: "token"; content: string }
  | { type: "done"; usage: TokenUsage | null; durationMs: number }
  | { type: "error"; message: string };

export interface NimModel {
  id: string;
  name: string;
  contextWindow: number;
  description: string;
}
