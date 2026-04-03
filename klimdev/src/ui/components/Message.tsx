// A single chat message bubble.
// User messages are right-leaning; assistant messages fill the available width.

import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";
import { ChatMessage } from "../../api/types.js";

interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  streamingContent?: string;
}

export function Message({ message, isStreaming, streamingContent }: MessageProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const content =
    isStreaming && isAssistant && streamingContent !== undefined
      ? streamingContent
      : message.content;

  const label = isUser ? "you" : "klimdev";
  const labelColor = isUser ? theme.userLabel : theme.assistantLabel;

  return (
    <Box
      flexDirection="column"
      marginBottom={1}
      paddingX={1}
    >
      {/* Sender label */}
      <Box flexDirection="row" gap={1} marginBottom={0}>
        <Text bold color={labelColor}>
          {label}
        </Text>
        {isStreaming && isAssistant && (
          <Text color={theme.textMuted} dimColor>
            streaming…
          </Text>
        )}
      </Box>

      {/* Message body */}
      <Box paddingLeft={2}>
        <Text color={isUser ? theme.textNormal : theme.textStrong} wrap="wrap">
          {content}
          {isStreaming && isAssistant && (
            <Text color={theme.cursor}>▋</Text>
          )}
        </Text>
      </Box>
    </Box>
  );
}
