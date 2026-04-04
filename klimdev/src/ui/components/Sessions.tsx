// Session history panel — shown in the left sidebar below the file explorer.
// Lists recent chat sessions with name and timestamp.

import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";
import { Session } from "../../core/history.js";
import { timeAgo } from "../../utils/time.js";
import { truncate } from "../../utils/format.js";

interface SessionsProps {
  sessions: Session[];
  activeSessionId: string;
  selectedIndex: number;
  focused: boolean;
  expanded: boolean;
  onToggle: () => void;
}

export function Sessions({
  sessions,
  activeSessionId,
  selectedIndex,
  focused,
  expanded,
}: SessionsProps) {
  return (
    <Box flexDirection="column">
      {/* Section header */}
      <Box paddingX={1} flexDirection="row" gap={1}>
        <Text color={theme.accent}>{expanded ? "▼" : "▶"}</Text>
        <Text bold color={theme.textNormal}>
          Sessions
        </Text>
        <Text color={theme.textMuted}>({sessions.length})</Text>
      </Box>

      {expanded && (
        <Box flexDirection="column" paddingLeft={1}>
          {sessions.length === 0 ? (
            <Text color={theme.textMuted}> (no sessions yet)</Text>
          ) : (
            sessions.map((session, idx) => {
              const isSelected = idx === selectedIndex && focused;
              const isActive = session.id === activeSessionId;

              return (
                <Box key={session.id} flexDirection="row" gap={1}>
                  <Text color={isSelected ? theme.accent : "transparent"}>›</Text>
                  <Box flexDirection="column">
                    <Text
                      bold={isActive}
                      color={
                        isActive
                          ? theme.accent
                          : isSelected
                          ? theme.textStrong
                          : theme.textNormal
                      }
                    >
                      {truncate(session.name, 20)}
                    </Text>
                    <Text color={theme.textMuted}>
                      {" "}
                      {timeAgo(session.createdAt)}
                    </Text>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      )}
    </Box>
  );
}
