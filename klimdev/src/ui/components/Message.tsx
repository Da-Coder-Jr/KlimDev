// A single chat message — clean and spacious like opencode's style.
// User messages have a subtle left border in red; assistant messages in blue.

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
  const content =
    isStreaming && !isUser && streamingContent !== undefined
      ? streamingContent
      : message.content;

  return (
    <Box flexDirection="row" marginBottom={1} paddingX={1}>
      {/* Colored left border strip */}
      <Box width={1} flexShrink={0}>
        <Text color={isUser ? theme.userLabel : theme.assistantLabel}>│</Text>
      </Box>

      <Box flexDirection="column" paddingLeft={1} flexGrow={1}>
        {/* Role label */}
        <Box marginBottom={0}>
          <Text bold color={isUser ? theme.userLabel : theme.assistantLabel}>
            {isUser ? "you" : "klimdev"}
          </Text>
          {isStreaming && !isUser && (
            <Text color={theme.textMuted} dimColor>  thinking…</Text>
          )}
        </Box>

        {/* Message body */}
        <Box paddingTop={0}>
          <Text color={theme.textStrong} wrap="wrap">
            {content}
            {isStreaming && !isUser && (
              <Text color={theme.cursor}>▋</Text>
            )}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
