// `klimdev chat` command — launches the interactive TUI.
// This is the default command when no subcommand is given.

import React from "react";
import { render } from "ink";
import { App } from "../../ui/App.js";
import { getApiKey } from "../../config/index.js";
import { cwd } from "process";

export async function runChat() {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error(
      [
        "",
        "  ✗ No NVIDIA API key found.",
        "",
        "  Set it via environment variable:",
        "    export NVIDIA_API_KEY=nvapi-...",
        "",
        "  Or save it to config:",
        "    klimdev config set-key nvapi-...",
        "",
      ].join("\n")
    );
    process.exit(1);
  }

  const workspaceRoot = cwd();

  const { waitUntilExit } = render(<App workspaceRoot={workspaceRoot} />, {
    fullscreen: true,
    exitOnCtrlC: true,
  });

  await waitUntilExit();
}
