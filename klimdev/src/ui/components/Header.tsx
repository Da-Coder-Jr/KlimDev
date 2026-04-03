// Header bar — spans the full terminal width at the top.
// Shows the KlimDev logo, active model name, and current time.

import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";
import { formatTime } from "../../utils/time.js";
import { findModel } from "../../api/models.js";

interface HeaderProps {
  modelId: string;
  currentTime: string;
}

export function Header({ modelId, currentTime }: HeaderProps) {
  const model = findModel(modelId);
  const modelLabel = model ? model.name : modelId;

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingX={2}
      borderStyle="single"
      borderColor={theme.accent}
      borderTop={false}
      borderLeft={false}
      borderRight={false}
    >
      {/* Brand */}
      <Box flexDirection="row" gap={1}>
        <Text bold color={theme.accent}>
          KLIMDEV
        </Text>
        <Text color={theme.textMuted}>|</Text>
        <Text color={theme.textWeak}>AI workspace</Text>
      </Box>

      {/* Active model */}
      <Box flexDirection="row" gap={1}>
        <Text color={theme.textMuted}>model:</Text>
        <Text color={theme.info}>{modelLabel}</Text>
      </Box>

      {/* Clock */}
      <Text color={theme.textWeak}>{currentTime}</Text>
    </Box>
  );
}
