// Workspace file tree builder.
// Reads the local filesystem (starting from cwd or a given root) and
// constructs a tree structure for the sidebar file explorer.
// Expandable/collapsible folders are tracked by a Set of open paths.

import { readdirSync, statSync, existsSync } from "fs";
import { join, relative, basename } from "path";

export interface FileNode {
  name: string;
  path: string;       // absolute path
  relativePath: string; // relative to workspace root
  isDir: boolean;
  depth: number;
  children?: FileNode[];
}

// Directories and file patterns we skip to keep the tree clean
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".next",
  "build",
  "coverage",
  "__pycache__",
  ".cache",
  "target",
  ".turbo",
]);

const SKIP_EXTENSIONS = new Set([
  ".lock",
]);

function shouldSkip(name: string): boolean {
  if (name.startsWith(".") && name !== ".env.example" && name !== ".gitignore") return true;
  if (SKIP_DIRS.has(name)) return true;
  const ext = name.slice(name.lastIndexOf("."));
  if (SKIP_EXTENSIONS.has(ext)) return true;
  return false;
}

export function buildFileTree(root: string, depth = 0, maxDepth = 4): FileNode[] {
  if (!existsSync(root)) return [];
  if (depth > maxDepth) return [];

  let entries: string[];
  try {
    entries = readdirSync(root);
  } catch {
    return [];
  }

  const nodes: FileNode[] = [];

  // Sort: directories first, then files, both alphabetically
  const sorted = entries
    .filter((e) => !shouldSkip(e))
    .sort((a, b) => {
      const aIsDir = isDirectory(join(root, a));
      const bIsDir = isDirectory(join(root, b));
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });

  for (const entry of sorted) {
    const fullPath = join(root, entry);
    const isDir = isDirectory(fullPath);

    nodes.push({
      name: entry,
      path: fullPath,
      relativePath: relative(process.cwd(), fullPath),
      isDir,
      depth,
      children: isDir ? [] : undefined, // populated on expand
    });
  }

  return nodes;
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

// Flattens the tree into a linear list for rendering in the sidebar,
// respecting which paths are currently expanded.
export function flattenTree(
  nodes: FileNode[],
  expandedPaths: Set<string>,
  root: string
): FileNode[] {
  const result: FileNode[] = [];

  for (const node of nodes) {
    result.push(node);

    if (node.isDir && expandedPaths.has(node.path)) {
      const children = buildFileTree(node.path, node.depth + 1);
      const flattened = flattenTree(children, expandedPaths, root);
      result.push(...flattened);
    }
  }

  return result;
}
