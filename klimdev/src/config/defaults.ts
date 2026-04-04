// Default configuration values for KlimDev.
// These are the fallback values when the user hasn't set anything yet.

import { DEFAULT_MODEL_ID } from "../api/models.js";

export const DEFAULTS = {
  modelId: DEFAULT_MODEL_ID,
  temperature: 0.6,
  maxTokens: 2048,
  systemPrompt:
    "You are KlimDev, an expert AI coding assistant. Be concise, precise, and helpful.",
  theme: "dark" as const,
  sidebarWidth: 28,
  showTelemetry: true,
};

export type KlimDevConfig = typeof DEFAULTS & {
  apiKey?: string;
};
