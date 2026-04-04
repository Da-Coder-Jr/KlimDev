// CLI router — parses argv and dispatches to the appropriate command.

import { runChat } from "./commands/chat.js";
import { runConfigCommand } from "./commands/config.js";
import { runModelsCommand } from "./commands/models.js";

const HELP = `
KlimDev — AI-powered terminal workspace

Usage:
  klimdev [command]

Commands:
  chat        Start the interactive TUI (default)
  models      List available NVIDIA NIM models
  config      Manage configuration (API key, model, etc.)
  version     Print version
  help        Show this help message

Environment:
  NVIDIA_API_KEY    Your NVIDIA NIM API key (overrides saved config)

Examples:
  klimdev
  klimdev chat
  klimdev config set-key nvapi-...
  klimdev config set-model nvidia/llama-3.1-nemotron-70b-instruct
  klimdev models
`;

export async function runCLI(argv: string[]) {
  const [, , command, ...rest] = argv;

  switch (command) {
    case undefined:
    case "chat":
      await runChat();
      break;

    case "models":
      runModelsCommand();
      break;

    case "config":
      runConfigCommand(rest);
      break;

    case "version":
      console.log("klimdev 1.0.0");
      break;

    case "help":
    case "--help":
    case "-h":
      console.log(HELP);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.error("Run `klimdev help` for usage.");
      process.exit(1);
  }
}
