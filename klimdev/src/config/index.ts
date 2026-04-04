// Configuration manager.
// Reads/writes a JSON config file via the `conf` package.
// Falls back to environment variables for the API key.

import Conf from "conf";
import { DEFAULTS, KlimDevConfig } from "./defaults.js";

const store = new Conf<KlimDevConfig>({
  projectName: "klimdev",
  defaults: DEFAULTS,
});

export function getConfig(): KlimDevConfig {
  const raw = store.store;

  // API key: prefer env var so CI/CD workflows work without a config file
  const apiKey = process.env.NVIDIA_API_KEY ?? raw.apiKey;

  return { ...raw, apiKey };
}

export function setConfig(partial: Partial<KlimDevConfig>): void {
  for (const [key, value] of Object.entries(partial)) {
    store.set(key as keyof KlimDevConfig, value);
  }
}

export function clearConfig(): void {
  store.clear();
}

export function getApiKey(): string | undefined {
  return process.env.NVIDIA_API_KEY ?? store.get("apiKey");
}
