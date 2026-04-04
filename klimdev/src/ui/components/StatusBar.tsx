// Status bar — bottom row spanning the full terminal width.
// Shows keyboard shortcuts, active panel, and session info.

import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

interface StatusBarProps {
  activePanel: string;
  sessionId: string;
  messageCount: number;
  isStreaming: boolean;
}

interface ShortcutProps {
  keys: string;
  description: string;
}

function Shortcut({ keys, description }: ShortcutProps) {
  return (
    <Box flexDirection="row" gap={0} marginRight={2}>
      <Text backgroundColor="#2A2A2A" color={theme.textStrong}>
        {" "}{keys}{" "}
      </Text>
      <Text color={theme.textWeak}> {description}</Text>
    </Box>
  );
}

export function StatusBar({ activePanel, sessionId, messageCount, isStreaming }: StatusBarProps) {
  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingX={1}
      borderStyle="single"
      borderColor={theme.border}
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
    >
      {/* Shortcuts */}
      <Box flexDirection="row" flexWrap="wrap">
        <Shortcut keys="Tab" description="panel" />
        <Shortcut keys="↑↓" description="navigate" />
        <Shortcut keys="↵" description="select/send" />
        <Shortcut keys="Ctrl+N" description="new session" />
        <Shortcut keys="Ctrl+M" description="models" />
      </Box>

      {/* Right side info */}
      <Box flexDirection="row" gap={2}>
        <Text color={theme.textMuted}>
          panel: <Text color={theme.info}>{activePanel}</Text>
        </Text>
        <Text color={theme.textMuted}>
          msgs: <Text color={theme.textNormal}>{messageCount}</Text>
        </Text>
        {isStreaming && (
          <Text color={theme.accent}>● streaming</Text>
        )}
      </Box>
    </Box>
  );
}
