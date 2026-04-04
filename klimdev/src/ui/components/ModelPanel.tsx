// Model selector panel — shown in the left sidebar.
// Lists all available NVIDIA NIM models and lets the user pick one.

import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";
import { NIM_MODELS } from "../../api/models.js";
import { truncate } from "../../utils/format.js";

interface ModelPanelProps {
  activeModelId: string;
  selectedIndex: number;
  focused: boolean;
  expanded: boolean;
}

export function ModelPanel({ activeModelId, selectedIndex, focused, expanded }: ModelPanelProps) {
  return (
    <Box flexDirection="column">
      {/* Section header */}
      <Box paddingX={1} flexDirection="row" gap={1}>
        <Text color={theme.info}>{expanded ? "▼" : "▶"}</Text>
        <Text bold color={theme.textNormal}>
          Models
        </Text>
      </Box>

      {expanded && (
        <Box flexDirection="column" paddingLeft={1}>
          {NIM_MODELS.map((model, idx) => {
            const isSelected = idx === selectedIndex && focused;
            const isActive = model.id === activeModelId;

            return (
              <Box key={model.id} flexDirection="row" gap={1}>
                <Text color={isSelected ? theme.accent : "transparent"}>›</Text>
                <Box flexDirection="column">
                  <Text
                    bold={isActive}
                    color={
                      isActive
                        ? theme.success
                        : isSelected
                        ? theme.textStrong
                        : theme.sidebarFg
                    }
                  >
                    {isActive ? "● " : "○ "}
                    {truncate(model.name, 22)}
                  </Text>
                  <Text color={theme.textMuted}>
                    {" "}
                    ctx:{" "}
                    {model.contextWindow >= 100_000
                      ? `${Math.round(model.contextWindow / 1000)}k`
                      : model.contextWindow.toLocaleString()}
                  </Text>
                </Box>
              </Box>
            );
          })}

          <Box marginTop={1} paddingX={1}>
            <Text color={theme.textMuted} italic>
              via NVIDIA NIM
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
