// Chat message viewport — renders the conversation history.
// Automatically shows the streaming message at the bottom while a reply is in flight.

import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";
import { ChatMessage } from "../../api/types.js";
import { Message } from "./Message.js";

interface ChatViewProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  lastError: string | null;
}

export function ChatView({ messages, isStreaming, streamingContent, lastError }: ChatViewProps) {
  if (messages.length === 0 && !isStreaming) {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1} flexGrow={1}>
        <Box flexDirection="column" gap={0} alignItems="center" justifyContent="center" flexGrow={1}>
          <Text bold color={theme.accent}>
            KLIMDEV
          </Text>
          <Text color={theme.textWeak}>AI-powered terminal workspace</Text>
          <Box marginTop={1}>
            <Text color={theme.textMuted}>
              Type a message below and press Enter to start chatting.
            </Text>
          </Box>
          <Box marginTop={1} flexDirection="column" gap={0}>
            <Text color={theme.textMuted}>
              Powered by NVIDIA NIM · Tab to switch panels
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1} overflowY="hidden">
      {/* Existing messages */}
      {messages.map((msg, idx) => {
        const isLastAssistant =
          idx === messages.length - 1 && msg.role === "assistant";

        return (
          <Message
            key={idx}
            message={msg}
            isStreaming={isStreaming && isLastAssistant}
            streamingContent={isStreaming && isLastAssistant ? streamingContent : undefined}
          />
        );
      })}

      {/* Streaming reply not yet committed to messages[] */}
      {isStreaming && (messages.length === 0 || messages[messages.length - 1].role === "user") && (
        <Message
          message={{ role: "assistant", content: streamingContent }}
          isStreaming
          streamingContent={streamingContent}
        />
      )}

      {/* Error display */}
      {lastError && (
        <Box paddingX={1} marginTop={1}>
          <Text color={theme.error}>⚠ {lastError}</Text>
        </Box>
      )}
    </Box>
  );
}
