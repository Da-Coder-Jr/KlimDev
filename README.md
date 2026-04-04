# KlimDev

AI-powered terminal workspace built with NVIDIA NIM.

## Quick start

```bash
cd klimdev
npm install          # or bun install / pnpm install
export NVIDIA_API_KEY=nvapi-...
npm run dev          # launch the TUI
```

## Commands

```
klimdev               Start the TUI
klimdev models        List available models
klimdev config        Manage settings
klimdev help          Show help
```

## Structure

```
klimdev/
├── src/
│   ├── api/          NVIDIA NIM client + streaming parser
│   ├── cli/          Argument routing + subcommands
│   ├── config/       Config file management
│   ├── core/         Session state + file tree + history
│   ├── ui/
│   │   ├── components/  Header, Sidebar, Explorer, ChatView,
│   │   │                InputBar, Telemetry, StatusBar
│   │   └── hooks/       useChat, useFileTree, useKeyboard
│   └── utils/        Format, time, truncate helpers
└── bin/klimdev       Executable entry point
```

## Keyboard shortcuts

| Key       | Action               |
|-----------|----------------------|
| Tab       | Switch panel         |
| ↑ / ↓     | Navigate sidebar     |
| Enter     | Select / Send        |
| Ctrl+N    | New session          |
| Ctrl+M    | Focus model selector |
| Ctrl+C    | Quit                 |
| Esc       | Clear input          |
