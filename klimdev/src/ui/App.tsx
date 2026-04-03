// App — root component for the KlimDev TUI.
// Lays out the three-column workspace:
//   [Sidebar (28)] | [Chat + Input (flex)] | [Telemetry (24)]
// and wires up all keyboard handlers.

import React, { useState, useCallback, useEffect } from "react";
import { Box, useStdout } from "ink";
import { Header } from "./components/Header.js";
import { Sidebar, SidebarSection } from "./components/Sidebar.js";
import { ChatView } from "./components/ChatView.js";
import { InputBar } from "./components/InputBar.js";
import { Telemetry } from "./components/Telemetry.js";
import { StatusBar } from "./components/StatusBar.js";
import { useChat } from "./hooks/useChat.js";
import { useFileTree } from "./hooks/useFileTree.js";
import { useInputBuffer } from "./hooks/useInput.js";
import { useKeyboard, ActivePanel } from "./hooks/useKeyboard.js";
import { NIM_MODELS } from "../api/models.js";
import { getConfig, setConfig } from "../config/index.js";
import { formatTime } from "../utils/time.js";
import { listSessions } from "../core/history.js";

interface AppProps {
  workspaceRoot: string;
}

export function App({ workspaceRoot }: AppProps) {
  const config = getConfig();
  const { stdout } = useStdout();

  // ── Time clock ─────────────────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(formatTime());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(formatTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Active model ───────────────────────────────────────────────────────────
  const [modelId, setModelId] = useState(config.modelId);

  // ── Chat state ─────────────────────────────────────────────────────────────
  const { state: chatState, sendMessage, clearSession, sessionId } = useChat(modelId);

  // ── File explorer ──────────────────────────────────────────────────────────
  const {
    visibleNodes,
    expandedPaths,
    selectedIndex: explorerIdx,
    selectUp: explorerUp,
    selectDown: explorerDown,
    activateSelected: explorerActivate,
  } = useFileTree(workspaceRoot);

  // ── Sessions panel ─────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState(() => listSessions());
  const [sessionIdx, setSessionIdx] = useState(0);
  const [sessionsExpanded, setSessionsExpanded] = useState(true);

  // ── Models panel ──────────────────────────────────────────────────────────
  const [modelIdx, setModelIdx] = useState(() =>
    NIM_MODELS.findIndex((m) => m.id === modelId)
  );
  const [modelsExpanded, setModelsExpanded] = useState(false);

  // ── Panel focus ────────────────────────────────────────────────────────────
  const [activePanel, setActivePanel] = useState<ActivePanel>("chat");
  const [sidebarSection, setSidebarSection] = useState<SidebarSection>("explorer");

  // ── Input buffer ───────────────────────────────────────────────────────────
  const input = useInputBuffer();

  // ── Sidebar navigation dispatchers ────────────────────────────────────────
  const sidebarUp = useCallback(() => {
    if (sidebarSection === "explorer") explorerUp();
    else if (sidebarSection === "sessions") setSessionIdx((p) => Math.max(0, p - 1));
    else if (sidebarSection === "models") setModelIdx((p) => Math.max(0, p - 1));
  }, [sidebarSection, explorerUp]);

  const sidebarDown = useCallback(() => {
    if (sidebarSection === "explorer") explorerDown();
    else if (sidebarSection === "sessions")
      setSessionIdx((p) => Math.min(sessions.length - 1, p + 1));
    else if (sidebarSection === "models")
      setModelIdx((p) => Math.min(NIM_MODELS.length - 1, p + 1));
  }, [sidebarSection, explorerDown, sessions.length]);

  const sidebarActivate = useCallback(() => {
    if (sidebarSection === "explorer") {
      explorerActivate();
    } else if (sidebarSection === "models") {
      const selected = NIM_MODELS[modelIdx];
      if (selected) {
        setModelId(selected.id);
        setConfig({ modelId: selected.id });
      }
    }
  }, [sidebarSection, explorerActivate, modelIdx]);

  // ── Keyboard wiring ────────────────────────────────────────────────────────
  useKeyboard(activePanel, {
    sidebarUp,
    sidebarDown,
    sidebarActivate,

    inputChar: (char) => {
      if (chatState.status !== "streaming") input.appendChar(char);
    },
    inputBackspace: () => input.deleteChar(),
    inputClear: () => input.clear(),
    inputSubmit: () => {
      if (chatState.status === "streaming") return;
      const text = input.consume();
      if (text.trim()) void sendMessage(text);
    },

    switchPanel: () => {
      setActivePanel((p) => (p === "chat" ? "sidebar" : "chat"));
    },
    switchSidebarSection: (section) => {
      setActivePanel("sidebar");
      setSidebarSection(section);
      if (section === "models") setModelsExpanded(true);
    },
    newSession: () => {
      clearSession();
      setSessions(listSessions());
      input.clear();
    },
  });

  // ── Terminal dimensions ────────────────────────────────────────────────────
  const termWidth = stdout?.columns ?? 120;
  const sidebarWidth = Math.min(30, Math.floor(termWidth * 0.22));
  const telemetryWidth = Math.min(26, Math.floor(termWidth * 0.20));

  return (
    <Box flexDirection="column" height="100%">
      {/* ── Top header bar ──────────────────────────────── */}
      <Header modelId={modelId} currentTime={currentTime} />

      {/* ── Main body: sidebar | chat | telemetry ────────── */}
      <Box flexDirection="row" flexGrow={1} overflow="hidden">
        {/* Left sidebar */}
        <Sidebar
          focusedSection={activePanel === "sidebar" ? sidebarSection : "explorer"}
          fileNodes={visibleNodes}
          expandedPaths={expandedPaths}
          explorerSelectedIdx={explorerIdx}
          explorerExpanded={true}
          sessions={sessions}
          activeSessionId={sessionId}
          sessionSelectedIdx={sessionIdx}
          sessionsExpanded={sessionsExpanded}
          onToggleSessions={() => setSessionsExpanded((p) => !p)}
          activeModelId={modelId}
          modelSelectedIdx={modelIdx}
          modelsExpanded={modelsExpanded}
          onToggleModels={() => setModelsExpanded((p) => !p)}
          width={sidebarWidth}
        />

        {/* Center: chat + input */}
        <Box flexDirection="column" flexGrow={1} overflow="hidden">
          <ChatView
            messages={chatState.messages}
            isStreaming={chatState.status === "streaming"}
            streamingContent={chatState.streamingContent}
            lastError={chatState.lastError}
          />
          <InputBar
            value={input.value}
            cursorOffset={input.cursorOffset}
            isStreaming={chatState.status === "streaming"}
            focused={activePanel === "chat"}
          />
        </Box>

        {/* Right telemetry panel */}
        <Telemetry
          promptTokens={chatState.promptTokens}
          completionTokens={chatState.completionTokens}
          totalTokens={chatState.totalTokens}
          requestCount={chatState.requestCount}
          lastDurationMs={chatState.lastDurationMs}
          isStreaming={chatState.status === "streaming"}
          modelId={modelId}
          width={telemetryWidth}
        />
      </Box>

      {/* ── Bottom status bar ───────────────────────────── */}
      <StatusBar
        activePanel={activePanel}
        sessionId={sessionId}
        messageCount={chatState.messages.length}
        isStreaming={chatState.status === "streaming"}
      />
    </Box>
  );
}
