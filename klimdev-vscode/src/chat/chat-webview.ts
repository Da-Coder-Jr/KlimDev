import * as vscode from "vscode";

export function getChatWebviewContent(webview: vscode.Webview): string {
  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --border: var(--vscode-panel-border, #333);
      --input-bg: var(--vscode-input-background);
      --input-fg: var(--vscode-input-foreground);
      --input-border: var(--vscode-input-border, #444);
      --button-bg: var(--vscode-button-background);
      --button-fg: var(--vscode-button-foreground);
      --button-hover: var(--vscode-button-hoverBackground);
      --accent: var(--vscode-focusBorder, #007acc);
      --user-bg: var(--vscode-textBlockQuote-background, #1a1a2e);
      --assistant-bg: transparent;
      --code-bg: var(--vscode-textCodeBlock-background, #1e1e2e);
      --scrollbar: var(--vscode-scrollbarSlider-background);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: var(--vscode-font-family, 'Segoe UI', system-ui, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      color: var(--fg);
      background: var(--bg);
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .header-title {
      font-weight: 600;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .header-title .logo {
      width: 16px; height: 16px;
      background: var(--accent);
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      color: white;
    }
    .header-actions {
      display: flex;
      gap: 4px;
    }
    .icon-btn {
      background: none;
      border: none;
      color: var(--fg);
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 4px;
      font-size: 14px;
      opacity: 0.7;
    }
    .icon-btn:hover {
      opacity: 1;
      background: var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.1));
    }

    /* Messages */
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
      scroll-behavior: smooth;
    }
    .messages::-webkit-scrollbar { width: 6px; }
    .messages::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 3px; }

    .message {
      padding: 10px 14px;
      margin: 2px 0;
      line-height: 1.55;
      word-wrap: break-word;
    }
    .message.user {
      background: var(--user-bg);
      border-left: 3px solid var(--accent);
    }
    .message.assistant {
      background: var(--assistant-bg);
    }
    .message.error {
      color: var(--vscode-errorForeground, #f44);
      background: var(--vscode-inputValidation-errorBackground, rgba(255,0,0,0.1));
      border-left: 3px solid var(--vscode-errorForeground, #f44);
    }

    .message-role {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.6;
      margin-bottom: 4px;
    }

    /* Markdown rendering */
    .message p { margin: 4px 0; }
    .message ul, .message ol { margin: 4px 0; padding-left: 20px; }
    .message li { margin: 2px 0; }
    .message strong { font-weight: 600; }
    .message em { font-style: italic; }

    .message code {
      background: var(--code-bg);
      padding: 1px 5px;
      border-radius: 3px;
      font-family: var(--vscode-editor-font-family, 'Consolas', monospace);
      font-size: 12px;
    }

    .code-block {
      position: relative;
      margin: 8px 0;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    .code-block-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 10px;
      background: rgba(255,255,255,0.03);
      border-bottom: 1px solid var(--border);
      font-size: 11px;
      opacity: 0.7;
    }
    .code-block-actions {
      display: flex;
      gap: 4px;
    }
    .code-block-actions button {
      background: none;
      border: 1px solid var(--border);
      color: var(--fg);
      padding: 2px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
      opacity: 0.8;
    }
    .code-block-actions button:hover {
      opacity: 1;
      background: var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.1));
    }
    .code-block pre {
      margin: 0;
      padding: 10px 12px;
      background: var(--code-bg);
      overflow-x: auto;
      font-family: var(--vscode-editor-font-family, 'Consolas', monospace);
      font-size: 12px;
      line-height: 1.5;
    }

    /* Streaming indicator */
    .streaming-cursor {
      display: inline-block;
      width: 7px;
      height: 14px;
      background: var(--accent);
      animation: blink 0.8s infinite;
      vertical-align: text-bottom;
      margin-left: 2px;
    }
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }

    /* Welcome */
    .welcome {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      flex: 1;
    }
    .welcome-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--accent), #76b900);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-bottom: 16px;
      color: white;
      font-weight: bold;
    }
    .welcome h2 {
      font-size: 16px;
      margin-bottom: 8px;
    }
    .welcome p {
      opacity: 0.6;
      font-size: 12px;
      margin-bottom: 16px;
      max-width: 260px;
    }
    .quick-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
    }
    .quick-action {
      padding: 6px 12px;
      background: var(--input-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      cursor: pointer;
      font-size: 11px;
      color: var(--fg);
      transition: background 0.15s;
    }
    .quick-action:hover {
      background: var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.1));
      border-color: var(--accent);
    }

    /* Input */
    .input-area {
      border-top: 1px solid var(--border);
      padding: 10px 12px;
      flex-shrink: 0;
    }
    .input-wrapper {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      border-radius: 8px;
      padding: 6px 10px;
      transition: border-color 0.15s;
    }
    .input-wrapper:focus-within {
      border-color: var(--accent);
    }
    .input-wrapper textarea {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--input-fg);
      font-family: inherit;
      font-size: 13px;
      resize: none;
      min-height: 20px;
      max-height: 120px;
      line-height: 1.4;
    }
    .send-btn {
      background: var(--button-bg);
      color: var(--button-fg);
      border: none;
      border-radius: 6px;
      padding: 5px 10px;
      cursor: pointer;
      font-size: 13px;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .send-btn:hover { background: var(--button-hover); }
    .send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .send-btn.stop {
      background: var(--vscode-errorForeground, #f44);
    }

    .context-hint {
      font-size: 11px;
      opacity: 0.5;
      margin-top: 6px;
      text-align: center;
    }

    /* Thinking dots */
    .thinking {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 12px 14px;
      opacity: 0.6;
    }
    .thinking-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--fg);
      animation: pulse 1.2s infinite ease-in-out;
    }
    .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
    .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes pulse {
      0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
      40% { opacity: 1; transform: scale(1); }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-title">
      <div class="logo">K</div>
      KlimDev AI
    </div>
    <div class="header-actions">
      <button class="icon-btn" onclick="newChat()" title="New Chat">+</button>
    </div>
  </div>

  <div id="messages" class="messages">
    <div id="welcome" class="welcome">
      <div class="welcome-icon">K</div>
      <h2>KlimDev AI</h2>
      <p>AI-powered coding assistant using NVIDIA NIM. Ask questions, get completions, refactor code, and more.</p>
      <div class="quick-actions">
        <button class="quick-action" onclick="sendQuick('Explain this code')">Explain Code</button>
        <button class="quick-action" onclick="sendQuick('Find bugs in this code')">Find Bugs</button>
        <button class="quick-action" onclick="sendQuick('Refactor this code')">Refactor</button>
        <button class="quick-action" onclick="sendQuick('Write tests for this code')">Write Tests</button>
        <button class="quick-action" onclick="sendQuick('Optimize this code')">Optimize</button>
      </div>
    </div>
  </div>

  <div class="input-area">
    <div class="input-wrapper">
      <textarea
        id="input"
        placeholder="Ask KlimDev anything... (Shift+Enter for newline)"
        rows="1"
      ></textarea>
      <button id="sendBtn" class="send-btn" onclick="handleSend()">→</button>
    </div>
    <div class="context-hint">⌘L to focus · ⌘K for inline edit · Right-click for actions</div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const messagesEl = document.getElementById('messages');
    const welcomeEl = document.getElementById('welcome');
    const inputEl = document.getElementById('input');
    const sendBtn = document.getElementById('sendBtn');

    let isStreaming = false;
    let currentStreamEl = null;
    let streamBuffer = '';
    let hasMessages = false;

    // Auto-resize textarea
    inputEl.addEventListener('input', () => {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    function handleSend() {
      if (isStreaming) {
        vscode.postMessage({ type: 'stopGeneration' });
        return;
      }
      const text = inputEl.value.trim();
      if (!text) return;

      addUserMessage(text);
      vscode.postMessage({ type: 'sendMessage', text });
      inputEl.value = '';
      inputEl.style.height = 'auto';
    }

    function sendQuick(text) {
      inputEl.value = text;
      handleSend();
    }

    function newChat() {
      vscode.postMessage({ type: 'newChat' });
    }

    function addUserMessage(text) {
      if (!hasMessages) {
        welcomeEl.style.display = 'none';
        hasMessages = true;
      }
      const div = document.createElement('div');
      div.className = 'message user';
      div.innerHTML = '<div class="message-role">You</div>' + renderMarkdown(text);
      messagesEl.appendChild(div);
      scrollToBottom();
    }

    function scrollToBottom() {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // Simple markdown renderer
    function renderMarkdown(text) {
      // Escape HTML
      let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      // Code blocks
      html = html.replace(/\`\`\`(\\w*)\n([\\s\\S]*?)\`\`\`/g, (_, lang, code) => {
        const langLabel = lang || 'code';
        return '<div class="code-block">' +
          '<div class="code-block-header">' +
          '<span>' + langLabel + '</span>' +
          '<div class="code-block-actions">' +
          '<button onclick="copyCode(this)">Copy</button>' +
          '<button onclick="insertCode(this)">Insert</button>' +
          '<button onclick="applyCode(this, \\'' + langLabel + '\\')">Apply</button>' +
          '</div></div>' +
          '<pre><code>' + code + '</code></pre></div>';
      });

      // Inline code
      html = html.replace(/\`([^\`]+)\`/g, '<code>$1</code>');

      // Bold
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

      // Italic
      html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

      // Line breaks → paragraphs
      html = html.replace(/\n\n/g, '</p><p>');
      html = html.replace(/\n/g, '<br>');
      html = '<p>' + html + '</p>';

      return html;
    }

    function copyCode(btn) {
      const code = btn.closest('.code-block').querySelector('code').textContent;
      vscode.postMessage({ type: 'copyCode', code });
    }

    function insertCode(btn) {
      const code = btn.closest('.code-block').querySelector('code').textContent;
      vscode.postMessage({ type: 'insertCode', code });
    }

    function applyCode(btn, lang) {
      const code = btn.closest('.code-block').querySelector('code').textContent;
      vscode.postMessage({ type: 'applyDiff', code, language: lang });
    }

    // Handle messages from extension
    window.addEventListener('message', (event) => {
      const msg = event.data;
      switch (msg.type) {
        case 'startStreaming':
          isStreaming = true;
          streamBuffer = '';
          sendBtn.textContent = '■';
          sendBtn.classList.add('stop');

          if (!hasMessages) {
            welcomeEl.style.display = 'none';
            hasMessages = true;
          }

          currentStreamEl = document.createElement('div');
          currentStreamEl.className = 'message assistant';
          currentStreamEl.innerHTML = '<div class="message-role">KlimDev</div><div class="stream-content"><div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div></div>';
          messagesEl.appendChild(currentStreamEl);
          scrollToBottom();
          break;

        case 'streamChunk':
          if (currentStreamEl) {
            streamBuffer += msg.text;
            const contentEl = currentStreamEl.querySelector('.stream-content');
            contentEl.innerHTML = renderMarkdown(streamBuffer) + '<span class="streaming-cursor"></span>';
            scrollToBottom();
          }
          break;

        case 'endStreaming':
          isStreaming = false;
          sendBtn.textContent = '→';
          sendBtn.classList.remove('stop');
          if (currentStreamEl) {
            const contentEl = currentStreamEl.querySelector('.stream-content');
            contentEl.innerHTML = renderMarkdown(streamBuffer);
          }
          currentStreamEl = null;
          streamBuffer = '';
          scrollToBottom();
          break;

        case 'streamError':
          if (currentStreamEl) {
            currentStreamEl.remove();
          }
          const errDiv = document.createElement('div');
          errDiv.className = 'message error';
          errDiv.innerHTML = '<div class="message-role">Error</div><p>' + msg.text + '</p>';
          messagesEl.appendChild(errDiv);
          isStreaming = false;
          sendBtn.textContent = '→';
          sendBtn.classList.remove('stop');
          currentStreamEl = null;
          streamBuffer = '';
          scrollToBottom();
          break;

        case 'addUserMessage':
          addUserMessage(msg.text);
          break;

        case 'clearChat':
          hasMessages = false;
          messagesEl.innerHTML = '';
          messagesEl.appendChild(welcomeEl);
          welcomeEl.style.display = '';
          break;
      }
    });

    // Focus input on load
    inputEl.focus();
  </script>
</body>
</html>`;
}
