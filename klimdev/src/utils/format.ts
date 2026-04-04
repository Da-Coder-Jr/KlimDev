// Text formatting helpers used across the UI

// Truncates a string to maxLen characters, adding an ellipsis if needed.
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

// Pads a string to a fixed width (left or right aligned).
export function pad(str: string, width: number, align: "left" | "right" = "left"): string {
  if (str.length >= width) return str.slice(0, width);
  const spaces = " ".repeat(width - str.length);
  return align === "left" ? str + spaces : spaces + str;
}

// Wraps text to fit within a given column width.
// Returns an array of lines.
export function wordWrap(text: string, width: number): string[] {
  if (width <= 0) return [text];

  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (paragraph.length <= width) {
      lines.push(paragraph);
      continue;
    }

    const words = paragraph.split(" ");
    let current = "";

    for (const word of words) {
      if (current.length === 0) {
        current = word.slice(0, width);
      } else if (current.length + 1 + word.length <= width) {
        current += " " + word;
      } else {
        lines.push(current);
        current = word.slice(0, width);
      }
    }

    if (current.length > 0) lines.push(current);
  }

  return lines.length > 0 ? lines : [""];
}

// Formats a number with comma separators.
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

// Formats a duration in milliseconds as a human-readable string.
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);
  return `${mins}m ${secs}s`;
}
