// File explorer panel — shown in the left sidebar.
// Renders an expandable/collapsible directory tree.
// Arrow keys navigate, Enter toggles folders.

import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";
import { FileNode } from "../../core/workspace.js";

interface ExplorerProps {
  nodes: FileNode[];
  expandedPaths: Set<string>;
  selectedIndex: number;
  focused: boolean;
}

// Icon characters for the tree
const ICON_DIR_CLOSED = "▶";
const ICON_DIR_OPEN = "▼";
const ICON_FILE = "·";

// Picks a color for a file based on its extension
function fileColor(name: string): string {
  const ext = name.slice(name.lastIndexOf("."));
  if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) return "#00CCFF";
  if ([".json", ".yaml", ".yml", ".toml"].includes(ext)) return "#FFAA00";
  if ([".md", ".txt", ".rst"].includes(ext)) return "#B0B0B0";
  if ([".rs", ".go", ".py", ".rb"].includes(ext)) return "#00FF88";
  if ([".css", ".scss", ".sass"].includes(ext)) return "#FF6699";
  if ([".sh", ".bash", ".zsh"].includes(ext)) return "#FF0033";
  return "#E0E0E0";
}

export function Explorer({ nodes, expandedPaths, selectedIndex, focused }: ExplorerProps) {
  if (nodes.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color={theme.textMuted}>(empty)</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} overflowY="hidden">
      {nodes.map((node, idx) => {
        const isSelected = idx === selectedIndex;
        const indent = "  ".repeat(node.depth);

        const icon = node.isDir
          ? expandedPaths.has(node.path)
            ? ICON_DIR_OPEN
            : ICON_DIR_CLOSED
          : ICON_FILE;

        const iconColor = node.isDir
          ? expandedPaths.has(node.path)
            ? theme.accent
            : theme.sidebarDir
          : fileColor(node.name);

        const labelColor = node.isDir
          ? theme.sidebarDir
          : fileColor(node.name);

        return (
          <Box key={node.path} flexDirection="row">
            {/* Selection indicator */}
            <Text color={isSelected && focused ? theme.accent : "transparent"}>
              {isSelected ? "›" : " "}
            </Text>

            {/* Indentation + icon + name */}
            <Text color={isSelected ? theme.textStrong : labelColor}>
              {indent}
              <Text color={iconColor}>{icon} </Text>
              <Text
                bold={node.isDir}
                color={isSelected && focused ? theme.accent : labelColor}
              >
                {node.name}
                {node.isDir ? "/" : ""}
              </Text>
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
