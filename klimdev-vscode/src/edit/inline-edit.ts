import * as vscode from "vscode";
import { getNimClient, NimMessage } from "../api/nim-client";
import { INLINE_EDIT_SYSTEM, buildInlineEditPrompt } from "../api/prompts";

const DECORATION_TYPE = vscode.window.createTextEditorDecorationType({
  backgroundColor: new vscode.ThemeColor("diffEditor.insertedTextBackground"),
  isWholeLine: false,
});

const REMOVED_DECORATION_TYPE = vscode.window.createTextEditorDecorationType({
  backgroundColor: new vscode.ThemeColor("diffEditor.removedTextBackground"),
  isWholeLine: true,
  opacity: "0.6",
});

interface PendingEdit {
  editor: vscode.TextEditor;
  originalCode: string;
  newCode: string;
  range: vscode.Range;
}

let pendingEdit: PendingEdit | undefined;

export async function startInlineEdit() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("No active editor");
    return;
  }

  const selection = editor.selection;
  let range: vscode.Range;
  let selectedCode: string;

  if (selection.isEmpty) {
    // Use current line
    const line = editor.document.lineAt(selection.active.line);
    range = line.range;
    selectedCode = line.text;
  } else {
    range = new vscode.Range(selection.start, selection.end);
    selectedCode = editor.document.getText(range);
  }

  const instruction = await vscode.window.showInputBox({
    prompt: "How should KlimDev modify this code?",
    placeHolder: "e.g., Add error handling, Convert to async/await, Make it more efficient",
    title: "KlimDev Inline Edit (⌘K)",
  });

  if (!instruction) return;

  const language = editor.document.languageId;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "KlimDev: Generating edit...",
      cancellable: true,
    },
    async (progress, cancelToken) => {
      try {
        const client = getNimClient();

        const messages: NimMessage[] = [
          { role: "system", content: INLINE_EDIT_SYSTEM },
          {
            role: "user",
            content: buildInlineEditPrompt(selectedCode, instruction, language),
          },
        ];

        let newCode = "";
        for await (const chunk of client.stream({ messages, temperature: 0.2 }, cancelToken)) {
          newCode += chunk;
          progress.report({ message: `${newCode.split("\n").length} lines...` });
        }

        // Clean up response — strip markdown fences if present
        newCode = cleanCodeResponse(newCode);

        if (!newCode.trim()) {
          vscode.window.showWarningMessage("KlimDev: No changes generated");
          return;
        }

        // Show diff inline
        pendingEdit = {
          editor,
          originalCode: selectedCode,
          newCode,
          range,
        };

        // Apply the edit with decorations to show what changed
        await showInlineDiff(editor, range, newCode);

        // Set context for keybindings
        vscode.commands.executeCommand(
          "setContext",
          "klimdev.inlineEditActive",
          true
        );

        vscode.window.showInformationMessage(
          "KlimDev: Edit ready — ⌘Enter to accept, Esc to reject",
          "Accept",
          "Reject"
        ).then((choice) => {
          if (choice === "Accept") {
            acceptInlineEdit();
          } else if (choice === "Reject") {
            rejectInlineEdit();
          }
        });
      } catch (error: any) {
        if (!cancelToken.isCancellationRequested) {
          vscode.window.showErrorMessage(`KlimDev: ${error.message}`);
        }
      }
    }
  );
}

async function showInlineDiff(
  editor: vscode.TextEditor,
  range: vscode.Range,
  newCode: string
) {
  // Replace the code temporarily
  await editor.edit((editBuilder) => {
    editBuilder.replace(range, newCode);
  });

  // Highlight the new code
  const newRange = new vscode.Range(
    range.start,
    editor.document.positionAt(
      editor.document.offsetAt(range.start) + newCode.length
    )
  );

  editor.setDecorations(DECORATION_TYPE, [newRange]);
  editor.revealRange(newRange, vscode.TextEditorRevealType.InCenter);
}

export async function acceptInlineEdit() {
  if (!pendingEdit) return;

  const { editor } = pendingEdit;
  editor.setDecorations(DECORATION_TYPE, []);
  editor.setDecorations(REMOVED_DECORATION_TYPE, []);

  vscode.commands.executeCommand("setContext", "klimdev.inlineEditActive", false);
  pendingEdit = undefined;
}

export async function rejectInlineEdit() {
  if (!pendingEdit) return;

  const { editor, originalCode, range } = pendingEdit;

  // Restore original code
  const currentNewRange = new vscode.Range(
    range.start,
    editor.document.positionAt(
      editor.document.offsetAt(range.start) + pendingEdit.newCode.length
    )
  );

  await editor.edit((editBuilder) => {
    editBuilder.replace(currentNewRange, originalCode);
  });

  editor.setDecorations(DECORATION_TYPE, []);
  editor.setDecorations(REMOVED_DECORATION_TYPE, []);

  vscode.commands.executeCommand("setContext", "klimdev.inlineEditActive", false);
  pendingEdit = undefined;
}

function cleanCodeResponse(text: string): string {
  // Remove markdown code fences
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/^```\w*\n([\s\S]*?)```$/);
  if (fenceMatch) {
    cleaned = fenceMatch[1];
  }
  // Remove leading/trailing backticks
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
  }
  return cleaned;
}
