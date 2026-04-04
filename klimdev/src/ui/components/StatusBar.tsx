// Status bar — single line at the bottom.
// Shows mode, shortcuts, and live token count inline (no separate telemetry pane).

import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";
import { formatNumber } from "../../utils/format.js";

interface StatusBarProps {
  activePanel: string;
  messageCount: number;
  isStreaming: boolean;
  totalTokens: number;
  tokensPerSecond: number;
}

function Key({ k }: { k: string }) {
  return <Text color={theme.textWeak}>{k}</Text>;
}

export function StatusBar({
  activePanel,
  messageCount,
  isStreaming,
  totalTokens,
  tokensPerSecond,
}: StatusBarProps) {
  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      paddingX={2}
      borderStyle="single"
      borderColor={theme.border}
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
    >
      {/* Left: shortcuts */}
      <Box flexDirection="row" gap={2}>
        <Box gap={1}>
          <Key k="Tab" /><Text color={theme.textMuted}>panel</Text>
        </Box>
        <Box gap={1}>
          <Key k="[" /><Text color={theme.textMuted}>sidebar</Text>
        </Box>
        <Box gap={1}>
          <Key k="^N" /><Text color={theme.textMuted}>new</Text>
        </Box>
        <Box gap={1}>
          <Key k="^M" /><Text color={theme.textMuted}>model</Text>
        </Box>
      </Box>

      {/* Right: live stats */}
      <Box flexDirection="row" gap={2}>
        {isStreaming && (
          <Text color={theme.accent}>● streaming {tokensPerSecond > 0 ? `${tokensPerSecond}t/s` : ""}</Text>
        )}
        {totalTokens > 0 && !isStreaming && (
          <Text color={theme.textMuted}>{formatNumber(totalTokens)} tokens</Text>
        )}
        <Text color={theme.textMuted}>{messageCount} msgs</Text>
        <Text color={theme.textMuted}>
          <Text color={activePanel === "chat" ? theme.info : theme.textWeak}>
            {activePanel}
          </Text>
        </Text>
      </Box>
    </Box>
  );
}
