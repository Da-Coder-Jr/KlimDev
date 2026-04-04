// Minimal header bar — brand name, active model, and clock.
// Stays out of the way so the chat panel can breathe.

import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";
import { findModel } from "../../api/models.js";

interface HeaderProps {
  modelId: string;
  currentTime: string;
  sidebarOpen: boolean;
}

export function Header({ modelId, currentTime, sidebarOpen }: HeaderProps) {
  const model = findModel(modelId);
  const modelName = model?.name ?? modelId.split("/").pop() ?? modelId;

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingX={2}
      paddingY={0}
      borderStyle="single"
      borderColor={theme.accent}
      borderTop={false}
      borderLeft={false}
      borderRight={false}
    >
      <Box flexDirection="row" gap={1} alignItems="center">
        <Text bold color={theme.accent}>KlimDev</Text>
        <Text color={theme.textMuted}>·</Text>
        <Text color={theme.info} dimColor>{modelName}</Text>
      </Box>

      <Box flexDirection="row" gap={2}>
        <Text color={theme.textMuted} dimColor>
          [{sidebarOpen ? "[ ] sidebar" : "[ ] sidebar"}]
        </Text>
        <Text color={theme.textWeak}>{currentTime}</Text>
      </Box>
    </Box>
  );
}
