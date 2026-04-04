// Input bar — clean single-line input with a subtle border.
// Looks like opencode's compact input rather than a multi-line box.

import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

interface InputBarProps {
  value: string;
  cursorOffset: number;
  isStreaming: boolean;
  focused: boolean;
}

export function InputBar({ value, isStreaming, focused }: InputBarProps) {
  const borderColor = isStreaming
    ? theme.textMuted
    : focused
    ? theme.accent
    : theme.border;

  return (
    <Box
      flexDirection="row"
      borderStyle="round"
      borderColor={borderColor}
      paddingX={2}
      paddingY={0}
      marginX={1}
      marginBottom={1}
      alignItems="center"
      minHeight={3}
    >
      <Text color={theme.accent} bold>›</Text>
      <Text> </Text>
      <Box flexGrow={1}>
        {value ? (
          <Text color={theme.textStrong} wrap="wrap">
            {value}
            {!isStreaming && focused && <Text color={theme.cursor}>▋</Text>}
          </Text>
        ) : (
          <Text color={theme.textMuted} dimColor>
            {isStreaming ? "waiting for response…" : "message KlimDev…"}
            {!isStreaming && focused && <Text color={theme.textMuted}>▋</Text>}
          </Text>
        )}
      </Box>

      {isStreaming && (
        <Text color={theme.accent} dimColor>  ●</Text>
      )}
    </Box>
  );
}
