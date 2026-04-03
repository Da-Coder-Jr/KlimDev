// NVIDIA NIM model catalog — only models available on integrate.api.nvidia.com
// These are the models KlimDev supports. No other providers.

import { NimModel } from "./types.js";

export const NIM_MODELS: NimModel[] = [
  {
    id: "nvidia/llama-3.1-nemotron-70b-instruct",
    name: "Llama 3.1 Nemotron 70B",
    contextWindow: 128000,
    description: "NVIDIA's top-tier instruction-tuned Llama 3.1 70B variant",
  },
  {
    id: "nvidia/llama-3.3-nemotron-super-49b-v1",
    name: "Llama 3.3 Nemotron Super 49B",
    contextWindow: 128000,
    description: "Compact and fast Nemotron model for everyday tasks",
  },
  {
    id: "meta/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B Instruct",
    contextWindow: 128000,
    description: "Meta's Llama 3.1 70B instruction-following model",
  },
  {
    id: "meta/llama-3.1-8b-instruct",
    name: "Llama 3.1 8B Instruct",
    contextWindow: 128000,
    description: "Lightweight Llama 3.1 8B — fast responses on simple tasks",
  },
  {
    id: "meta/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B Instruct",
    contextWindow: 128000,
    description: "Latest Llama 3.3 generation — strong coding and reasoning",
  },
  {
    id: "mistralai/mistral-large-2-instruct",
    name: "Mistral Large 2",
    contextWindow: 128000,
    description: "Mistral AI's flagship instruction model via NIM",
  },
  {
    id: "mistralai/mistral-nemo-12b-instruct",
    name: "Mistral NeMo 12B",
    contextWindow: 128000,
    description: "Efficient 12B model co-developed by Mistral and NVIDIA",
  },
  {
    id: "google/gemma-2-27b-it",
    name: "Gemma 2 27B IT",
    contextWindow: 8192,
    description: "Google's Gemma 2 instruction-tuned 27B model",
  },
  {
    id: "microsoft/phi-3-medium-128k-instruct",
    name: "Phi-3 Medium 128K",
    contextWindow: 128000,
    description: "Microsoft Phi-3 medium model with long context window",
  },
  {
    id: "qwen/qwen2.5-72b-instruct",
    name: "Qwen2.5 72B Instruct",
    contextWindow: 131072,
    description: "Alibaba Qwen2.5 72B — excellent multilingual and coding",
  },
];

export const DEFAULT_MODEL_ID = "nvidia/llama-3.1-nemotron-70b-instruct";

export function findModel(id: string): NimModel | undefined {
  return NIM_MODELS.find((m) => m.id === id);
}
