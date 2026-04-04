import * as vscode from "vscode";
import { getNimClient, NimMessage } from "../api/nim-client";
import { SYSTEM_PROMPT } from "../api/prompts";
import { getChatWebviewContent } from "./chat-webview";

interface ChatSession {
  id: string;
  title: string;
  messages: NimMessage[];
}

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "klimdev.chatView";
  private view?: vscode.WebviewView;
  private sessions: ChatSession[] = [];
  private currentSession: ChatSession;
  private isStreaming = false;
  private abortController?: { cancel: () => void };

  constructor(private readonly extensionUri: vscode.Uri) {
    this.currentSession = this.createSession();
    this.sessions.push(this.currentSession);
  }

  private createSession(): ChatSession {
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      title: "New Chat",
      messages: [],
    };
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = getChatWebviewContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "sendMessage":
          await this.handleUserMessage(message.text, message.context);
          break;
        case "stopGeneration":
          this.stopGeneration();
          break;
        case "newChat":
          this.newSession();
          break;
        case "insertCode":
          this.insertCodeToEditor(message.code);
          break;
        case "copyCode":
          vscode.env.clipboard.writeText(message.code);
          vscode.window.showInformationMessage("Code copied to clipboard");
          break;
        case "applyDiff":
          await this.applyCodeToEditor(message.code, message.language);
          break;
      }
    });
  }

  public async sendMessageFromCommand(text: string, context?: string) {
    if (this.view) {
      this.view.show(true);
    }
    await this.handleUserMessage(text, context);
  }

  public async sendCodeAction(action: string, code: string, language: string) {
    if (this.view) {
      this.view.show(true);
    }

    const text = `[${action}]\n\`\`\`${language}\n${code}\n\`\`\``;
    this.postMessage({ type: "addUserMessage", text });
    await this.handleUserMessage(text);
  }

  public newSession() {
    this.currentSession = this.createSession();
    this.sessions.push(this.currentSession);
    this.postMessage({ type: "clearChat" });
  }

  private async handleUserMessage(text: string, context?: string) {
    if (this.isStreaming) {
      return;
    }

    const userMessage: NimMessage = { role: "user", content: text };
    this.currentSession.messages.push(userMessage);

    // Auto-title from first message
    if (this.currentSession.messages.filter((m) => m.role === "user").length === 1) {
      this.currentSession.title = text.slice(0, 50);
    }

    this.postMessage({ type: "startStreaming" });
    this.isStreaming = true;

    try {
      const client = getNimClient();
      const config = vscode.workspace.getConfiguration("klimdev");
      const customSystemPrompt = config.get<string>("chat.systemPrompt") || "";

      const systemContent =
        SYSTEM_PROMPT +
        (customSystemPrompt ? "\n\n" + customSystemPrompt : "") +
        (context ? `\n\nCurrent context:\n${context}` : "");

      const messages: NimMessage[] = [
        { role: "system", content: systemContent },
        ...this.currentSession.messages,
      ];

      const tokenSource = new vscode.CancellationTokenSource();
      this.abortController = { cancel: () => tokenSource.cancel() };

      let fullResponse = "";

      for await (const chunk of client.stream(
        { messages },
        tokenSource.token
      )) {
        fullResponse += chunk;
        this.postMessage({ type: "streamChunk", text: chunk });
      }

      this.currentSession.messages.push({
        role: "assistant",
        content: fullResponse,
      });
    } catch (error: any) {
      const errorMsg = error.message || "An error occurred";
      this.postMessage({
        type: "streamError",
        text: errorMsg,
      });
    } finally {
      this.isStreaming = false;
      this.abortController = undefined;
      this.postMessage({ type: "endStreaming" });
    }
  }

  private stopGeneration() {
    if (this.abortController) {
      this.abortController.cancel();
    }
  }

  private insertCodeToEditor(code: string) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      editor.edit((editBuilder) => {
        editBuilder.insert(editor.selection.active, code);
      });
    }
  }

  private async applyCodeToEditor(code: string, language?: string) {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.selection && !editor.selection.isEmpty) {
      await editor.edit((editBuilder) => {
        editBuilder.replace(editor.selection, code);
      });
    } else {
      // Open in a new document
      const doc = await vscode.workspace.openTextDocument({
        content: code,
        language: language || "plaintext",
      });
      await vscode.window.showTextDocument(doc);
    }
  }

  private postMessage(message: any) {
    this.view?.webview.postMessage(message);
  }

  public getEditorContext(): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return undefined;

    const doc = editor.document;
    const selection = editor.selection;
    const language = doc.languageId;
    const fileName = doc.fileName.split("/").pop() || doc.fileName;

    let context = `File: ${fileName} (${language})`;

    if (!selection.isEmpty) {
      const selectedText = doc.getText(selection);
      context += `\nSelected code (lines ${selection.start.line + 1}-${selection.end.line + 1}):\n\`\`\`${language}\n${selectedText}\n\`\`\``;
    } else {
      // Include visible range for context
      const visibleRange = editor.visibleRanges[0];
      if (visibleRange) {
        const visibleText = doc.getText(visibleRange);
        context += `\nVisible code (lines ${visibleRange.start.line + 1}-${visibleRange.end.line + 1}):\n\`\`\`${language}\n${visibleText}\n\`\`\``;
      }
    }

    return context;
  }
}
