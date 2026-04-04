// `klimdev models` command — lists all available NVIDIA NIM models.

import { NIM_MODELS } from "../../api/models.js";
import { getConfig } from "../../config/index.js";

export function runModelsCommand() {
  const config = getConfig();

  console.log("\nAvailable NVIDIA NIM models:\n");

  for (const model of NIM_MODELS) {
    const isActive = model.id === config.modelId;
    const marker = isActive ? "●" : "○";
    const ctx =
      model.contextWindow >= 100_000
        ? `${Math.round(model.contextWindow / 1000)}k ctx`
        : `${model.contextWindow.toLocaleString()} ctx`;

    console.log(`  ${marker} ${model.name.padEnd(32)} ${ctx}`);
    console.log(`      ${model.id}`);
    console.log(`      ${model.description}`);
    console.log();
  }

  if (config.modelId) {
    console.log(`Active model: ${config.modelId}`);
  }
  console.log(
    "To change: klimdev config set-model <model-id>\n"
  );
}
