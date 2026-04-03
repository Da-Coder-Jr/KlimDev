// Left sidebar — composes the file explorer, session list, and model panel
// into a single scrollable column with collapsible sections.

import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";
import { Explorer } from "./Explorer.js";
import { Sessions } from "./Sessions.js";
import { ModelPanel } from "./ModelPanel.js";
import { FileNode } from "../../core/workspace.js";
import { Session } from "../../core/history.js";

export type SidebarSection = "explorer" | "sessions" | "models";

interface SidebarProps {
  // Which section has keyboard focus
  focusedSection: SidebarSection;

  // File explorer state
  fileNodes: FileNode[];
  expandedPaths: Set<string>;
  explorerSelectedIdx: number;
  explorerExpanded: boolean;

  // Sessions state
  sessions: Session[];
  activeSessionId: string;
  sessionSelectedIdx: number;
  sessionsExpanded: boolean;
  onToggleSessions: () => void;

  // Model panel state
  activeModelId: string;
  modelSelectedIdx: number;
  modelsExpanded: boolean;
  onToggleModels: () => void;

  // Layout
  width: number;
}

export function Sidebar(props: SidebarProps) {
  const {
    focusedSection,
    fileNodes,
    expandedPaths,
    explorerSelectedIdx,
    explorerExpanded,
    sessions,
    activeSessionId,
    sessionSelectedIdx,
    sessionsExpanded,
    onToggleSessions,
    activeModelId,
    modelSelectedIdx,
    modelsExpanded,
    onToggleModels,
    width,
  } = props;

  return (
    <Box
      flexDirection="column"
      width={width}
      borderStyle="single"
      borderColor={focusedSection !== "explorer" ? theme.border : theme.borderActive}
      borderTop={false}
      borderBottom={false}
      borderLeft={false}
      paddingBottom={1}
      overflow="hidden"
    >
      {/* ── File Explorer ─────────────────────────────────── */}
      <Box paddingX={1} marginTop={1} flexDirection="row" gap={1}>
        <Text color={theme.accent}>{explorerExpanded ? "▼" : "▶"}</Text>
        <Text bold color={theme.textNormal}>
          Explorer
        </Text>
      </Box>

      {explorerExpanded && (
        <Box flexDirection="column" marginBottom={1}>
          <Explorer
            nodes={fileNodes}
            expandedPaths={expandedPaths}
            selectedIndex={explorerSelectedIdx}
            focused={focusedSection === "explorer"}
          />
        </Box>
      )}

      {/* ── Session History ───────────────────────────────── */}
      <Box marginTop={1}>
        <Sessions
          sessions={sessions}
          activeSessionId={activeSessionId}
          selectedIndex={sessionSelectedIdx}
          focused={focusedSection === "sessions"}
          expanded={sessionsExpanded}
          onToggle={onToggleSessions}
        />
      </Box>

      {/* ── Model Selector ───────────────────────────────── */}
      <Box marginTop={1}>
        <ModelPanel
          activeModelId={activeModelId}
          selectedIndex={modelSelectedIdx}
          focused={focusedSection === "models"}
          expanded={modelsExpanded}
        />
      </Box>

      {/* ── Keyboard hints ───────────────────────────────── */}
      <Box marginTop={1} paddingX={1} flexDirection="column">
        <Text color={theme.textMuted}>↑↓ navigate  ↵ toggle</Text>
        <Text color={theme.textMuted}>Tab switch panel</Text>
      </Box>
    </Box>
  );
}
