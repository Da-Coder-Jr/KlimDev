// Input bar — sits at the bottom of the main panel.
// Shows the user's current input, the cursor, and a submit hint.
// Becomes dimmed while a stream is in progress.

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
    ? theme.borderActive
    : theme.border;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor}
      paddingX={1}
      marginX={1}
      marginBottom={1}
    >
      {/* Text input display */}
      <Box flexDirection="row" minHeight={2}>
        <Text color={isStreaming ? theme.textMuted : theme.textStrong} wrap="wrap">
          {value || (
            <Text color={theme.textMuted} dimColor>
              {isStreaming ? "Waiting for response…" : "Ask anything…"}
            </Text>
          )}
          {!isStreaming && focused && <Text color={theme.cursor}>▋</Text>}
        </Text>
      </Box>

      {/* Hint bar */}
      <Box flexDirection="row" justifyContent="space-between" marginTop={0}>
        <Text color={theme.textMuted}>
          {isStreaming ? "streaming…" : "↵ send  ⌫ delete  Esc clear"}
        </Text>
        <Text color={theme.textMuted}>Ctrl+C quit</Text>
      </Box>
    </Box>
  );
}
