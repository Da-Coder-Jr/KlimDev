// useFileTree — manages expandable/collapsible file tree state.
// Exposes the flattened visible node list and toggle/navigation handlers.

import { useState, useMemo, useCallback } from "react";
import { buildFileTree, flattenTree, FileNode } from "../../core/workspace.js";

export function useFileTree(root: string) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Root-level nodes (built once; children are loaded on expand)
  const rootNodes = useMemo(() => buildFileTree(root), [root]);

  // Flattened list of all currently visible nodes
  const visibleNodes = useMemo(
    () => flattenTree(rootNodes, expandedPaths, root),
    [rootNodes, expandedPaths, root]
  );

  const toggleExpanded = useCallback(
    (path: string) => {
      setExpandedPaths((prev) => {
        const next = new Set(prev);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
        return next;
      });
    },
    []
  );

  const selectUp = useCallback(() => {
    setSelectedIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const selectDown = useCallback(() => {
    setSelectedIndex((prev) => Math.min(visibleNodes.length - 1, prev + 1));
  }, [visibleNodes.length]);

  const activateSelected = useCallback(() => {
    const node = visibleNodes[selectedIndex];
    if (!node) return;
    if (node.isDir) {
      toggleExpanded(node.path);
    }
    // For files, a future version could open them in an editor pane
  }, [visibleNodes, selectedIndex, toggleExpanded]);

  return {
    visibleNodes,
    expandedPaths,
    selectedIndex,
    selectUp,
    selectDown,
    activateSelected,
  };
}
