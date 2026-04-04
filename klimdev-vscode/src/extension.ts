import * as vscode from "vscode";
import { ChatViewProvider } from "./chat/chat-provider";
import { KlimDevCompletionProvider } from "./completion/completion-provider";
import { startInlineEdit, acceptInlineEdit, rejectInlineEdit } from "./edit/inline-edit";
import { registerCodeActions } from "./actions/code-actions";

let completionProvider: KlimDevCompletionProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log("[KlimDev] Activating KlimDev AI extension...");

  // --- Chat Sidebar ---
  const chatProvider = new ChatViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ChatViewProvider.viewType,
      chatProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // --- Commands ---
  context.subscriptions.push(
    // Open / focus chat
    vscode.commands.registerCommand("klimdev.openChat", () => {
      vscode.commands.executeCommand("klimdev.chatView.focus");
      // If there's a selection, include context
      const ctx = chatProvider.getEditorContext();
      if (ctx) {
        // Just focus — user types their message with context available
      }
    }),

    // New chat session
    vscode.commands.registerCommand("klimdev.newChat", () => {
      chatProvider.newSession();
    }),

    // Inline edit (Cmd+K)
    vscode.commands.registerCommand("klimdev.inlineEdit", startInlineEdit),
    vscode.commands.registerCommand("klimdev.acceptInlineEdit", acceptInlineEdit),
    vscode.commands.registerCommand("klimdev.rejectInlineEdit", rejectInlineEdit),

    // Toggle completion
    vscode.commands.registerCommand("klimdev.toggleCompletion", () => {
      completionProvider?.toggle();
    })
  );

  // --- Code Actions (Explain, Refactor, Fix, Docs, Tests) ---
  registerCodeActions(context, chatProvider);

  // --- Inline Completion ---
  completionProvider = new KlimDevCompletionProvider();
  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: "**" },
      completionProvider
    )
  );
  context.subscriptions.push(completionProvider);

  // --- Welcome / First Run ---
  const hasSeenWelcome = context.globalState.get<boolean>("klimdev.welcomed");
  if (!hasSeenWelcome) {
    const apiKey = vscode.workspace
      .getConfiguration("klimdev")
      .get<string>("nvidia.apiKey");

    if (!apiKey) {
      vscode.window
        .showInformationMessage(
          "Welcome to KlimDev AI! Set your NVIDIA NIM API key to get started.",
          "Open Settings",
          "Later"
        )
        .then((choice) => {
          if (choice === "Open Settings") {
            vscode.commands.executeCommand(
              "workbench.action.openSettings",
              "klimdev.nvidia.apiKey"
            );
          }
        });
    }
    context.globalState.update("klimdev.welcomed", true);
  }

  console.log("[KlimDev] Extension activated successfully!");
  console.log("[KlimDev] Features: Chat (⌘L), Inline Edit (⌘K), AI Autocomplete, Code Actions");
}

export function deactivate() {
  console.log("[KlimDev] Extension deactivated");
}
