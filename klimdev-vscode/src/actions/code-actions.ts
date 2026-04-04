import * as vscode from "vscode";
import { getNimClient, NimMessage } from "../api/nim-client";
import {
  SYSTEM_PROMPT,
  buildExplainPrompt,
  buildRefactorPrompt,
  buildFixPrompt,
  buildDocsPrompt,
  buildTestsPrompt,
} from "../api/prompts";
import { ChatViewProvider } from "../chat/chat-provider";

type ActionType = "explain" | "refactor" | "fix" | "docs" | "tests";

export function registerCodeActions(
  context: vscode.ExtensionContext,
  chatProvider: ChatViewProvider
) {
  context.subscriptions.push(
    vscode.commands.registerCommand("klimdev.explainCode", () =>
      runCodeAction("explain", chatProvider)
    ),
    vscode.commands.registerCommand("klimdev.refactorCode", () =>
      runCodeAction("refactor", chatProvider)
    ),
    vscode.commands.registerCommand("klimdev.fixCode", () =>
      runCodeAction("fix", chatProvider)
    ),
    vscode.commands.registerCommand("klimdev.generateDocs", () =>
      runCodeAction("docs", chatProvider)
    ),
    vscode.commands.registerCommand("klimdev.generateTests", () =>
      runCodeAction("tests", chatProvider)
    )
  );
}

async function runCodeAction(
  action: ActionType,
  chatProvider: ChatViewProvider
) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("No active editor");
    return;
  }

  const selection = editor.selection;
  if (selection.isEmpty) {
    vscode.window.showWarningMessage("Please select some code first");
    return;
  }

  const selectedCode = editor.document.getText(selection);
  const language = editor.document.languageId;

  // For explain, refactor, fix → use chat panel
  if (action === "explain" || action === "refactor" || action === "fix") {
    let prompt: string;
    let diagnostics: string | undefined;

    if (action === "fix") {
      // Gather diagnostics for the selected range
      const diags = vscode.languages.getDiagnostics(editor.document.uri);
      const relevantDiags = diags.filter(
        (d) =>
          d.range.intersection(selection) !== undefined &&
          (d.severity === vscode.DiagnosticSeverity.Error ||
            d.severity === vscode.DiagnosticSeverity.Warning)
      );
      if (relevantDiags.length > 0) {
        diagnostics = relevantDiags
          .map(
            (d) =>
              `[${d.severity === vscode.DiagnosticSeverity.Error ? "ERROR" : "WARN"}] Line ${d.range.start.line + 1}: ${d.message}`
          )
          .join("\n");
      }
    }

    switch (action) {
      case "explain":
        prompt = buildExplainPrompt(selectedCode, language);
        break;
      case "refactor":
        prompt = buildRefactorPrompt(selectedCode, language);
        break;
      case "fix":
        prompt = buildFixPrompt(selectedCode, language, diagnostics);
        break;
    }

    await chatProvider.sendCodeAction(
      action.charAt(0).toUpperCase() + action.slice(1),
      selectedCode,
      language
    );
    return;
  }

  // For docs and tests → apply inline or open new file
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `KlimDev: Generating ${action}...`,
      cancellable: true,
    },
    async (progress, cancelToken) => {
      try {
        const client = getNimClient();

        let userPrompt: string;
        switch (action) {
          case "docs":
            userPrompt = buildDocsPrompt(selectedCode, language);
            break;
          case "tests":
            userPrompt = buildTestsPrompt(selectedCode, language);
            break;
          default:
            return;
        }

        const messages: NimMessage[] = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ];

        let result = "";
        for await (const chunk of client.stream({ messages }, cancelToken)) {
          result += chunk;
        }

        result = cleanCodeResponse(result);

        if (action === "docs") {
          // Replace selection with documented code
          await editor.edit((editBuilder) => {
            editBuilder.replace(selection, result);
          });
          vscode.window.showInformationMessage("KlimDev: Documentation added");
        } else if (action === "tests") {
          // Open test in a new file
          const doc = await vscode.workspace.openTextDocument({
            content: result,
            language,
          });
          await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
          vscode.window.showInformationMessage(
            "KlimDev: Tests generated in new tab"
          );
        }
      } catch (error: any) {
        if (!cancelToken.isCancellationRequested) {
          vscode.window.showErrorMessage(`KlimDev: ${error.message}`);
        }
      }
    }
  );
}

function cleanCodeResponse(text: string): string {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/^```\w*\n([\s\S]*?)```$/);
  if (fenceMatch) {
    cleaned = fenceMatch[1];
  }
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
  }
  return cleaned;
}
