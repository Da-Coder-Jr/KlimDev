// Root component — opencode-inspired two-column layout.
//
//   ┌──────────────────────────────────────────────────────┐
//   │  KlimDev · Llama 3.1 Nemotron 70B            12:34  │
//   ├──────────┬───────────────────────────────────────────┤
//   │  Files   │                                           │
//   │  ▶ src/  │   │ klimdev                               │
//   │    …     │   │ AI workspace · NVIDIA NIM             │
//   │  Sessions│   │                                       │
//   │  Models  │   │ Start typing to begin.                │
//   │          │  ╭─────────────────────────────────────╮  │
//   │          │  │ › message KlimDev…                  │  │
//   │          │  ╰─────────────────────────────────────╯  │
//   ├──────────┴───────────────────────────────────────────┤
//   │ Tab panel  [ sidebar  ^N new  ^M model   0 msgs      │
//   └──────────────────────────────────────────────────────┘
//
// Press [ to toggle the sidebar. Sidebar defaults to open.

import React, { useState, useCallback, useEffect } from "react";
import { Box, useStdout, useInput } from "ink";
import { Header } from "./components/Header.js";
import { Sidebar, SidebarSection } from "./components/Sidebar.js";
import { ChatView } from "./components/ChatView.js";
import { InputBar } from "./components/InputBar.js";
import { StatusBar } from "./components/StatusBar.js";
import { useChat } from "./hooks/useChat.js";
import { useFileTree } from "./hooks/useFileTree.js";
import { useInputBuffer } from "./hooks/useInput.js";
import { NIM_MODELS } from "../api/models.js";
import { getConfig, setConfig } from "../config/index.js";
import { formatTime } from "../utils/time.js";
import { listSessions } from "../core/history.js";

interface AppProps {
  workspaceRoot: string;
}

type ActivePanel = "sidebar" | "chat";

export function App({ workspaceRoot }: AppProps) {
  const config = getConfig();

  // ── Clock ───────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(formatTime());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(formatTime()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Model ────────────────────────────────────────────────
  const [modelId, setModelId] = useState(config.modelId);

  // ── Chat ─────────────────────────────────────────────────
  const { state: chatState, sendMessage, clearSession, sessionId } = useChat(modelId);

  // ── File tree ─────────────────────────────────────────────
  const {
    visibleNodes,
    expandedPaths,
    selectedIndex: explorerIdx,
    selectUp: explorerUp,
    selectDown: explorerDown,
    activateSelected: explorerActivate,
  } = useFileTree(workspaceRoot);

  // ── Sessions ──────────────────────────────────────────────
  const [sessions, setSessions] = useState(() => listSessions());
  const [sessionIdx, setSessionIdx] = useState(0);
  const [sessionsExpanded, setSessionsExpanded] = useState(true);

  // ── Models panel ──────────────────────────────────────────
  const [modelIdx, setModelIdx] = useState(
    () => Math.max(0, NIM_MODELS.findIndex((m) => m.id === modelId))
  );
  const [modelsExpanded, setModelsExpanded] = useState(false);

  // ── Panel / sidebar state ─────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<ActivePanel>("chat");
  const [sidebarSection, setSidebarSection] = useState<SidebarSection>("explorer");

  // ── Input buffer ──────────────────────────────────────────
  const input = useInputBuffer();

  // ── Keyboard ─────────────────────────────────────────────
  useInput((char, key) => {
    // Always: quit
    if (key.ctrl && char === "c") process.exit(0);

    // Always: toggle sidebar
    if (!key.ctrl && !key.meta && char === "[") {
      setSidebarOpen((p) => !p);
      return;
    }

    // Always: Tab — switch panel
    if (key.tab) {
      if (!sidebarOpen) return; // no sidebar to switch to
      setActivePanel((p) => (p === "chat" ? "sidebar" : "chat"));
      return;
    }

    // Always: Ctrl+N — new session
    if (key.ctrl && char === "n") {
      clearSession();
      setSessions(listSessions());
      input.clear();
      return;
    }

    // Always: Ctrl+M — focus model selector
    if (key.ctrl && char === "m") {
      setSidebarOpen(true);
      setActivePanel("sidebar");
      setSidebarSection("models");
      setModelsExpanded(true);
      return;
    }

    // ── Sidebar panel ──────────────────────────────────────
    if (activePanel === "sidebar" && sidebarOpen) {
      if (key.upArrow) {
        if (sidebarSection === "explorer") explorerUp();
        else if (sidebarSection === "sessions") setSessionIdx((p) => Math.max(0, p - 1));
        else if (sidebarSection === "models") setModelIdx((p) => Math.max(0, p - 1));
        return;
      }
      if (key.downArrow) {
        if (sidebarSection === "explorer") explorerDown();
        else if (sidebarSection === "sessions")
          setSessionIdx((p) => Math.min(sessions.length - 1, p + 1));
        else if (sidebarSection === "models")
          setModelIdx((p) => Math.min(NIM_MODELS.length - 1, p + 1));
        return;
      }
      if (key.return) {
        if (sidebarSection === "explorer") {
          explorerActivate();
        } else if (sidebarSection === "models") {
          const m = NIM_MODELS[modelIdx];
          if (m) {
            setModelId(m.id);
            setConfig({ modelId: m.id });
          }
        }
        return;
      }
      // Esc — go back to chat
      if (key.escape) {
        setActivePanel("chat");
        return;
      }
    }

    // ── Chat panel ──────────────────────────────────────────
    if (activePanel === "chat") {
      if (key.return) {
        if (chatState.status !== "streaming") {
          const text = input.consume();
          if (text.trim()) void sendMessage(text);
        }
        return;
      }
      if (key.escape) {
        input.clear();
        return;
      }
      if (key.backspace || key.delete) {
        input.deleteChar();
        return;
      }
      if (char && !key.ctrl && !key.meta) {
        if (chatState.status !== "streaming") input.appendChar(char);
        return;
      }
    }
  });

  // ── Layout ─────────────────────────────────────────────────
  const { stdout } = useStdout();
  const termWidth = stdout?.columns ?? 120;
  const sidebarWidth = Math.max(24, Math.min(32, Math.floor(termWidth * 0.22)));

  return (
    <Box flexDirection="column" height="100%">
      <Header modelId={modelId} currentTime={currentTime} sidebarOpen={sidebarOpen} />

      <Box flexDirection="row" flexGrow={1} overflow="hidden">
        {/* Sidebar — only rendered when open */}
        {sidebarOpen && (
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
        )}

        {/* Main: chat + input */}
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
      </Box>

      <StatusBar
        activePanel={activePanel}
        messageCount={chatState.messages.length}
        isStreaming={chatState.status === "streaming"}
        totalTokens={chatState.totalTokens}
        tokensPerSecond={chatState.tokensPerSecond}
      />
    </Box>
  );
}
