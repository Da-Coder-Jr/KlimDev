// Path and filename truncation helpers for the sidebar file explorer

import { basename } from "path";

// Shortens a file path for display in the sidebar.
// Shows the filename and at most one parent directory.
export function shortenPath(fullPath: string, maxLen = 24): string {
  const parts = fullPath.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  if (parts.length === 1) return parts[0].slice(0, maxLen);

  // Show last two segments: parent/filename
  const last = parts[parts.length - 1];
  const parent = parts[parts.length - 2];
  const combined = `${parent}/${last}`;
  if (combined.length <= maxLen) return combined;

  return last.slice(0, maxLen);
}

// Returns just the filename (basename) of a path.
export function fileName(path: string): string {
  return basename(path);
}
