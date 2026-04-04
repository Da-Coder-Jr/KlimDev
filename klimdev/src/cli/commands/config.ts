// `klimdev config` subcommand — manage API key and settings.

import { getConfig, setConfig, clearConfig } from "../../config/index.js";
import { NIM_MODELS } from "../../api/models.js";

export function runConfigCommand(args: string[]) {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "set-key": {
      const key = rest[0];
      if (!key) {
        console.error("Usage: klimdev config set-key <nvidia-api-key>");
        process.exit(1);
      }
      setConfig({ apiKey: key });
      console.log("✓ API key saved.");
      break;
    }

    case "set-model": {
      const modelId = rest[0];
      if (!modelId) {
        console.error("Usage: klimdev config set-model <model-id>");
        console.error("Run `klimdev models` to list available models.");
        process.exit(1);
      }
      const found = NIM_MODELS.find((m) => m.id === modelId);
      if (!found) {
        console.error(`Unknown model: ${modelId}`);
        console.error("Run `klimdev models` to list available models.");
        process.exit(1);
      }
      setConfig({ modelId });
      console.log(`✓ Default model set to: ${found.name}`);
      break;
    }

    case "show": {
      const cfg = getConfig();
      console.log("\nKlimDev configuration:");
      console.log(`  Model:       ${cfg.modelId}`);
      console.log(`  Temperature: ${cfg.temperature}`);
      console.log(`  Max tokens:  ${cfg.maxTokens}`);
      console.log(`  API key:     ${cfg.apiKey ? cfg.apiKey.slice(0, 8) + "…" : "(not set)"}`);
      console.log();
      break;
    }

    case "reset": {
      clearConfig();
      console.log("✓ Configuration reset to defaults.");
      break;
    }

    default:
      console.log(
        [
          "",
          "Usage: klimdev config <subcommand>",
          "",
          "Subcommands:",
          "  set-key <key>      Save your NVIDIA API key",
          "  set-model <id>     Set the default model",
          "  show               Print current configuration",
          "  reset              Reset to defaults",
          "",
        ].join("\n")
      );
  }
}
