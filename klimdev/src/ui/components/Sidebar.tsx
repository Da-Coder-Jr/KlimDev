// Left sidebar — file explorer + session list + model list.
// Opened/closed via the [ key. Styled to match opencode's clean panel look.

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
  focusedSection: SidebarSection;
  fileNodes: FileNode[];
  expandedPaths: Set<string>;
  explorerSelectedIdx: number;
  explorerExpanded: boolean;
  sessions: Session[];
  activeSessionId: string;
  sessionSelectedIdx: number;
  sessionsExpanded: boolean;
  onToggleSessions: () => void;
  activeModelId: string;
  modelSelectedIdx: number;
  modelsExpanded: boolean;
  onToggleModels: () => void;
  width: number;
}

function SectionHeader({
  label,
  expanded,
  count,
  color = theme.textNormal,
}: {
  label: string;
  expanded: boolean;
  count?: number;
  color?: string;
}) {
  return (
    <Box paddingX={1} paddingY={0} flexDirection="row" gap={1}>
      <Text color={color}>{expanded ? "▼" : "▶"}</Text>
      <Text color={color} bold>{label}</Text>
      {count !== undefined && (
        <Text color={theme.textMuted}>({count})</Text>
      )}
    </Box>
  );
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

  const isFocused = (s: SidebarSection) => focusedSection === s;

  return (
    <Box
      flexDirection="column"
      width={width}
      borderStyle="single"
      borderColor={theme.border}
      borderTop={false}
      borderBottom={false}
      borderLeft={false}
      overflow="hidden"
    >
      {/* ── Files ─────────────────────────────────── */}
      <Box marginTop={1}>
        <SectionHeader
          label="Files"
          expanded={explorerExpanded}
          color={isFocused("explorer") ? theme.accent : theme.textNormal}
        />
      </Box>
      {explorerExpanded && (
        <Box marginBottom={1}>
          <Explorer
            nodes={fileNodes}
            expandedPaths={expandedPaths}
            selectedIndex={explorerSelectedIdx}
            focused={isFocused("explorer")}
          />
        </Box>
      )}

      {/* ── Sessions ──────────────────────────────── */}
      <Box
        borderStyle="single"
        borderColor={theme.border}
        borderLeft={false}
        borderRight={false}
        borderBottom={false}
        paddingTop={1}
      >
        <Sessions
          sessions={sessions}
          activeSessionId={activeSessionId}
          selectedIndex={sessionSelectedIdx}
          focused={isFocused("sessions")}
          expanded={sessionsExpanded}
          onToggle={onToggleSessions}
        />
      </Box>

      {/* ── Models ────────────────────────────────── */}
      <Box
        borderStyle="single"
        borderColor={theme.border}
        borderLeft={false}
        borderRight={false}
        borderBottom={false}
        paddingTop={1}
      >
        <ModelPanel
          activeModelId={activeModelId}
          selectedIndex={modelSelectedIdx}
          focused={isFocused("models")}
          expanded={modelsExpanded}
        />
      </Box>

      {/* ── Nav hint ──────────────────────────────── */}
      <Box paddingX={1} marginTop={1}>
        <Text color={theme.textMuted} dimColor>↑↓ nav  ↵ open  [ close</Text>
      </Box>
    </Box>
  );
}
