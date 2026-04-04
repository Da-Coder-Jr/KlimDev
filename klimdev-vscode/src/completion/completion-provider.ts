import * as vscode from "vscode";
import { getNimClient } from "../api/nim-client";
import { COMPLETION_SYSTEM } from "../api/prompts";

export class KlimDevCompletionProvider implements vscode.InlineCompletionItemProvider {
  private debounceTimer: NodeJS.Timeout | undefined;
  private lastCancel: vscode.CancellationTokenSource | undefined;
  private enabled = true;
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = "klimdev.toggleCompletion";
    this.updateStatusBar();
    this.statusBarItem.show();

    // Read initial setting
    this.enabled =
      vscode.workspace.getConfiguration("klimdev").get<boolean>("completion.enabled") ??
      true;
    this.updateStatusBar();
  }

  toggle() {
    this.enabled = !this.enabled;
    this.updateStatusBar();
    vscode.window.showInformationMessage(
      `KlimDev AI Autocomplete: ${this.enabled ? "Enabled" : "Disabled"}`
    );
  }

  private updateStatusBar() {
    if (this.enabled) {
      this.statusBarItem.text = "$(sparkle) KlimDev";
      this.statusBarItem.tooltip = "KlimDev AI Autocomplete (Enabled) — Click to toggle";
      this.statusBarItem.color = undefined;
    } else {
      this.statusBarItem.text = "$(circle-slash) KlimDev";
      this.statusBarItem.tooltip = "KlimDev AI Autocomplete (Disabled) — Click to toggle";
      this.statusBarItem.color = new vscode.ThemeColor("disabledForeground");
    }
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[] | undefined> {
    if (!this.enabled) return undefined;

    // Cancel previous request
    if (this.lastCancel) {
      this.lastCancel.cancel();
    }

    // Debounce
    const debounceMs =
      vscode.workspace
        .getConfiguration("klimdev")
        .get<number>("completion.debounceMs") || 300;

    await new Promise<void>((resolve) => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(resolve, debounceMs);
    });

    if (token.isCancellationRequested) return undefined;

    const cancelSource = new vscode.CancellationTokenSource();
    this.lastCancel = cancelSource;

    // Combine tokens
    token.onCancellationRequested(() => cancelSource.cancel());

    try {
      const language = document.languageId;

      // Get prefix: up to 60 lines before cursor
      const prefixRange = new vscode.Range(
        new vscode.Position(Math.max(0, position.line - 60), 0),
        position
      );
      const prefix = document.getText(prefixRange);

      // Get suffix: up to 30 lines after cursor
      const suffixRange = new vscode.Range(
        position,
        new vscode.Position(
          Math.min(document.lineCount - 1, position.line + 30),
          Number.MAX_SAFE_INTEGER
        )
      );
      const suffix = document.getText(suffixRange);

      if (!prefix.trim() && !suffix.trim()) return undefined;

      const client = getNimClient();
      const completion = await client.completeCode(
        prefix,
        suffix,
        language,
        cancelSource.token
      );

      if (cancelSource.token.isCancellationRequested) return undefined;
      if (!completion || !completion.trim()) return undefined;

      return [
        new vscode.InlineCompletionItem(
          completion,
          new vscode.Range(position, position)
        ),
      ];
    } catch (error: any) {
      // Silently fail for completions — don't annoy the user
      if (!error.message?.includes("not configured")) {
        console.error("[KlimDev] Completion error:", error.message);
      }
      return undefined;
    }
  }

  dispose() {
    this.statusBarItem.dispose();
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.lastCancel) this.lastCancel.cancel();
  }
}
