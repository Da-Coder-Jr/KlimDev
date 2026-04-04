# KlimDev

AI-powered development tools built with NVIDIA NIM.

## Projects

### klimdev-vscode — AI Code Editor Extension

A VS Code extension that transforms VS Code into a **Cursor-like AI-powered editor** using NVIDIA NIM API. Full AI chat, inline completions, Cmd+K editing, and intelligent code actions.

#### Features

- **AI Chat Sidebar** (Cmd+L) — Conversational coding assistant with streaming responses, code blocks with copy/insert/apply actions, and full conversation history
- **Inline Code Completion** — Ghost-text AI autocomplete powered by NVIDIA NIM models (Qwen, CodeLlama, DeepSeek)
- **Inline Edit** (Cmd+K) — Select code, describe changes in natural language, preview diff, accept or reject
- **Code Actions** (right-click menu):
  - Explain Code — Get clear explanations of selected code
  - Refactor Code — AI-powered refactoring suggestions
  - Fix Code — Automatic bug detection and fixes (uses editor diagnostics)
  - Generate Docs — Add comprehensive documentation
  - Generate Tests — Create unit tests in a new tab

#### Quick Start

```bash
cd klimdev-vscode
npm install
npm run build
```

Then install in VS Code:
```bash
npm run package   # creates .vsix file
code --install-extension klimdev-0.1.0.vsix
```

Or for development:
```bash
npm run watch     # auto-rebuild on changes
# Press F5 in VS Code to launch Extension Development Host
```

#### Configuration

Open VS Code Settings and search for "KlimDev":

| Setting | Default | Description |
|---------|---------|-------------|
| `klimdev.nvidia.apiKey` | — | Your NVIDIA NIM API key (`nvapi-...`) |
| `klimdev.nvidia.baseUrl` | `https://integrate.api.nvidia.com/v1` | NIM API endpoint |
| `klimdev.nvidia.chatModel` | `meta/llama-3.1-70b-instruct` | Model for chat and code actions |
| `klimdev.nvidia.completionModel` | `qwen/qwen2.5-coder-32b-instruct` | Model for inline completions |
| `klimdev.completion.enabled` | `true` | Enable/disable AI autocomplete |
| `klimdev.completion.debounceMs` | `300` | Completion trigger delay |
| `klimdev.maxTokens` | `4096` | Max tokens per response |
| `klimdev.temperature` | `0.3` | Response creativity (0-1) |

#### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+L / Ctrl+L | Open AI Chat |
| Cmd+K / Ctrl+K | Inline Edit |
| Cmd+Shift+A / Ctrl+Shift+A | Toggle AI Autocomplete |
| Cmd+Enter / Ctrl+Enter | Accept inline edit |
| Escape | Reject inline edit |

#### Supported Models

**Chat & Code Actions:**
- Meta Llama 3.1 70B/405B Instruct
- Meta Llama 3.3 70B Instruct
- NVIDIA Nemotron 70B
- Mistral Large 2 / Mixtral 8x22B
- Google Gemma 2 27B
- Qwen 2.5 Coder 32B

**Inline Completions:**
- Qwen 2.5 Coder 32B (default)
- DeepSeek Coder 6.7B
- Meta CodeLlama 70B

---

### klimdev (TUI)

AI-powered terminal workspace built with NVIDIA NIM.

```bash
cd klimdev
npm install
export NVIDIA_API_KEY=nvapi-...
npm run dev
```

See `klimdev/` for the terminal UI project.
