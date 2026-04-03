# KlimDev

KlimDev is an AI-powered terminal application built on the opencode TUI framework,
rebranded with NVIDIA NIM as the exclusive AI provider.

## Setup

```bash
# Install dependencies
bun install

# Build
bun run build

# Run
./packages/opencode/bin/klimdev
```

## API Key

Set your NVIDIA NIM API key before running:

```bash
export NVIDIA_API_KEY=nvapi-...
# or
export NVIDIA_NIM_API_KEY=nvapi-...
```

Get a key at https://build.nvidia.com

## Theme

KlimDev ships with a custom dark theme:
- Background: #050505 (Vantablack)
- Accent: #FF0033 (Stapler Red)

Upstream: https://github.com/anomalyco/opencode (MIT)
