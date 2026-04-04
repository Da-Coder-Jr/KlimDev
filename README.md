# KlimDev

AI-powered terminal workspace. NVIDIA NIM · TypeScript · Ink.

## Quick start

```bash
git clone https://github.com/Da-Coder-Jr/KlimDev
cd KlimDev

# Option A — from the repo root (runs npm install inside klimdev/ for you)
export NVIDIA_API_KEY=nvapi-...
npm run dev

# Option B — go into the package directly
cd klimdev
npm install
npm run dev
```

## CLI commands

```
klimdev               Launch the TUI (default)
klimdev models        List available NVIDIA NIM models
klimdev config        Manage settings
  set-key <key>       Save your API key
  set-model <id>      Set default model
  show                Print current config
klimdev help          Show help
```

## Keyboard shortcuts

| Key       | Action                     |
|-----------|----------------------------|
| `[`       | Toggle sidebar open/closed |
| `Tab`     | Switch between chat/sidebar|
| `↑` / `↓` | Navigate sidebar           |
| `Enter`   | Open folder / select model |
| `Ctrl+N`  | New chat session           |
| `Ctrl+M`  | Open model selector        |
| `Esc`     | Clear input / back to chat |
| `Ctrl+C`  | Quit                       |

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  KlimDev · Llama 3.1 Nemotron 70B                   12:34  │
├──────────────┬──────────────────────────────────────────────┤
│ ▼ Files      │                                              │
│   ▶ src/     │  │ klimdev                                   │
│   ▼ klimdev/ │  │ AI workspace · NVIDIA NIM                 │
│     ▶ api/   │                                              │
│     ▶ ui/    │  Start typing to begin a conversation.       │
│ ▼ Sessions   │  Press [ to toggle sidebar.                  │
│ ▼ Models     │ ╭────────────────────────────────────────╮   │
│              │ │ › message KlimDev…                     │   │
│              │ ╰────────────────────────────────────────╯   │
├──────────────┴──────────────────────────────────────────────┤
│ Tab panel  [ sidebar  ^N new  ^M model          0 msgs      │
└─────────────────────────────────────────────────────────────┘
```
