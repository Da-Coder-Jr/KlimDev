// Telemetry panel — right sidebar showing live model metrics.
// Updates in real time during streaming.

import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";
import { formatNumber, formatDuration } from "../../utils/format.js";
import { computeTPS } from "../../utils/time.js";

interface TelemetryProps {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCount: number;
  lastDurationMs: number;
  isStreaming: boolean;
  modelId: string;
  width?: number;
}

function MetricRow({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
      <Text color={theme.metricLabel}>{label}</Text>
      <Box flexDirection="row" gap={0}>
        <Text color={theme.metricValue}>{value}</Text>
        {unit && <Text color={theme.metricUnit}> {unit}</Text>}
      </Box>
    </Box>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <Box paddingX={1} marginTop={1} marginBottom={0}>
      <Text color={theme.accent}>── {label}</Text>
    </Box>
  );
}

export function Telemetry({
  promptTokens,
  completionTokens,
  totalTokens,
  requestCount,
  lastDurationMs,
  isStreaming,
  modelId,
  width,
}: TelemetryProps) {
  const tps = computeTPS(completionTokens, lastDurationMs);

  // Short model name for display
  const shortModel = modelId.split("/").pop() ?? modelId;

  return (
    <Box
      flexDirection="column"
      width={width}
      borderStyle="single"
      borderColor={theme.border}
      borderTop={false}
      borderBottom={false}
      borderRight={false}
      paddingY={1}
    >
      {/* Header */}
      <Box paddingX={1} marginBottom={1}>
        <Text bold color={theme.accent}>
          ◈ Metrics
        </Text>
      </Box>

      {/* Status */}
      <MetricRow
        label="status"
        value={isStreaming ? "streaming" : requestCount === 0 ? "idle" : "ready"}
      />
      <MetricRow label="requests" value={String(requestCount)} />

      <Divider label="tokens" />
      <MetricRow label="prompt" value={formatNumber(promptTokens)} />
      <MetricRow label="completion" value={formatNumber(completionTokens)} />
      <MetricRow label="total" value={formatNumber(totalTokens)} />

      <Divider label="performance" />
      <MetricRow
        label="last duration"
        value={lastDurationMs > 0 ? formatDuration(lastDurationMs) : "—"}
      />
      <MetricRow
        label="speed"
        value={tps > 0 ? String(tps) : "—"}
        unit={tps > 0 ? "t/s" : undefined}
      />

      <Divider label="model" />
      <Box paddingX={1}>
        <Text color={theme.info} wrap="wrap">
          {shortModel}
        </Text>
      </Box>

      <Box marginTop={1} paddingX={1}>
        <Text color={theme.textMuted} italic>
          NVIDIA NIM
        </Text>
      </Box>
    </Box>
  );
}
