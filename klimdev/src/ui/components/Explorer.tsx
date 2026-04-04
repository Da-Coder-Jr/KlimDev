// File explorer — clean tree with indented entries.
// Directories show a triangle icon (▶ closed, ▼ open).

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

function fileColor(name: string): string {
  const ext = name.slice(name.lastIndexOf("."));
  if ([".ts", ".tsx"].includes(ext)) return "#60A5FA";
  if ([".js", ".jsx"].includes(ext)) return "#FCD34D";
  if ([".json", ".yaml", ".yml", ".toml"].includes(ext)) return "#FFAA00";
  if ([".md", ".txt"].includes(ext)) return "#9CA3AF";
  if ([".rs", ".go", ".py"].includes(ext)) return "#34D399";
  if ([".css", ".scss"].includes(ext)) return "#F472B6";
  if ([".sh", ".bash"].includes(ext)) return "#FF0033";
  return "#E0E0E0";
}

export function Explorer({ nodes, expandedPaths, selectedIndex, focused }: ExplorerProps) {
  if (nodes.length === 0) {
    return (
      <Box paddingX={1}>
        <Text color={theme.textMuted} dimColor>(empty)</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" overflowY="hidden">
      {nodes.map((node, idx) => {
        const isSelected = idx === selectedIndex;
        const indent = "  ".repeat(node.depth);
        const isOpen = node.isDir && expandedPaths.has(node.path);

        return (
          <Box key={node.path} flexDirection="row" paddingX={1}>
            {/* Selection mark */}
            <Text color={isSelected && focused ? theme.accent : "transparent"}>›</Text>

            {/* Entry */}
            <Text
              color={
                isSelected && focused
                  ? theme.accent
                  : node.isDir
                  ? theme.sidebarDir
                  : fileColor(node.name)
              }
            >
              {indent}
              {node.isDir ? (isOpen ? "▼ " : "▶ ") : "  "}
              <Text bold={node.isDir}>{node.name}{node.isDir ? "/" : ""}</Text>
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
