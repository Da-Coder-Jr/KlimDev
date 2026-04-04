// Chat message viewport — clean, spacious, opencode-inspired.
// The welcome screen shows when there are no messages yet.

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

function WelcomeScreen() {
  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      alignItems="center"
      justifyContent="center"
      paddingX={4}
    >
      <Box flexDirection="column" alignItems="center" gap={0}>
        <Text bold color={theme.accent}>
          ╔═══════════════╗
        </Text>
        <Text bold color={theme.accent}>
          ║   KLIMDEV     ║
        </Text>
        <Text bold color={theme.accent}>
          ╚═══════════════╝
        </Text>

        <Box marginTop={1}>
          <Text color={theme.textWeak}>AI workspace · NVIDIA NIM</Text>
        </Box>

        <Box marginTop={2} flexDirection="column" alignItems="center" gap={0}>
          <Text color={theme.textMuted}>Start typing to begin a conversation.</Text>
          <Text color={theme.textMuted}>Press <Text color={theme.textNormal}>[</Text> to toggle the sidebar.</Text>
          <Text color={theme.textMuted}>Press <Text color={theme.textNormal}>Ctrl+M</Text> to switch model.</Text>
        </Box>
      </Box>
    </Box>
  );
}

export function ChatView({ messages, isStreaming, streamingContent, lastError }: ChatViewProps) {
  if (messages.length === 0 && !isStreaming) {
    return <WelcomeScreen />;
  }

  // Is the last committed message a user message (assistant reply still streaming)?
  const lastIsUser =
    messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1} overflowY="hidden">
      <Box marginTop={1} />

      {messages.map((msg, idx) => {
        const isLastAssistant =
          idx === messages.length - 1 && msg.role === "assistant";
        return (
          <Message
            key={idx}
            message={msg}
            isStreaming={isStreaming && isLastAssistant}
            streamingContent={
              isStreaming && isLastAssistant ? streamingContent : undefined
            }
          />
        );
      })}

      {/* Streaming reply not yet appended to messages[] */}
      {isStreaming && lastIsUser && (
        <Message
          message={{ role: "assistant", content: streamingContent }}
          isStreaming
          streamingContent={streamingContent}
        />
      )}

      {lastError && (
        <Box paddingX={2} marginTop={1}>
          <Text color={theme.error}>⚠  {lastError}</Text>
        </Box>
      )}
    </Box>
  );
}
