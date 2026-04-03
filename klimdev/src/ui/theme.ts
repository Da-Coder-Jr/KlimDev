// KlimDev color theme — Vantablack background + Stapler Red accents.
// All hex values are passed directly to Ink's `<Text color="…">` prop.

export const theme = {
  // Background layers (Ink doesn't render bg colors, but useful as reference)
  bg: "#050505",

  // Primary text
  textStrong: "#E0E0E0",
  textNormal: "#B0B0B0",
  textWeak: "#707070",
  textMuted: "#404040",

  // Accent / brand
  accent: "#FF0033",
  accentDim: "#CC0029",

  // Semantic
  success: "#00FF88",
  warning: "#FFAA00",
  error: "#FF4444",
  info: "#00CCFF",

  // UI chrome
  border: "#2A2A2A",
  borderActive: "#FF0033",
  borderFocused: "#FF3355",

  // Sidebar
  sidebarFg: "#B0B0B0",
  sidebarSelected: "#FF0033",
  sidebarDir: "#00CCFF",
  sidebarFile: "#E0E0E0",

  // Chat bubbles
  userBubble: "#1A1A1A",
  assistantBubble: "#0D0D0D",
  userLabel: "#FF0033",
  assistantLabel: "#00CCFF",

  // Streaming cursor
  cursor: "#FF0033",

  // Telemetry panel
  metricLabel: "#707070",
  metricValue: "#00FF88",
  metricUnit: "#707070",
};

export type Theme = typeof theme;
