// Timing and rate utilities

// Returns a human-readable "time ago" string.
export function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

// Computes tokens per second from a completion token count and duration.
export function computeTPS(completionTokens: number, durationMs: number): number {
  if (durationMs <= 0 || completionTokens <= 0) return 0;
  return Math.round((completionTokens / durationMs) * 1000);
}

// Returns the current time formatted as HH:MM:SS.
export function formatTime(date = new Date()): string {
  return date.toTimeString().slice(0, 8);
}
