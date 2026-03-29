import { Card, Text, Grid, Box, Switch } from '@mantine/core';
import { TelemetryType } from '../../../types';

interface TelemetryTypeSelectorProps {
  telemetryType: TelemetryType;
  includeTraces: boolean;
  includeMetrics: boolean;
  includeLogs: boolean;
  correlationEnabled: boolean;
  onChange: (updates: {
    telemetryType?: TelemetryType;
    includeTraces?: boolean;
    includeMetrics?: boolean;
    includeLogs?: boolean;
    correlationEnabled?: boolean;
  }) => void;
}

const TELEMETRY_TYPES = [
  TelemetryType.UNIFIED,
  TelemetryType.TRACES,
  TelemetryType.METRICS,
  TelemetryType.LOGS,
];

export function TelemetryTypeSelector({
  telemetryType,
  includeTraces,
  includeMetrics,
  includeLogs,
  correlationEnabled,
  onChange,
}: TelemetryTypeSelectorProps) {
  return (
    <Card padding="md" radius="md" withBorder>
      <Text fw={500} mb="md" style={{ color: 'var(--color-text)' }}>Telemetry Type</Text>
      <Grid>
        {TELEMETRY_TYPES.map(type => (
          <Grid.Col key={type} span={3}>
            <Card
              padding="sm"
              radius="md"
              withBorder
              style={{
                cursor: 'pointer',
                borderColor: telemetryType === type ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: telemetryType === type ? 'var(--color-bg-highlighted)' : 'transparent',
              }}
              onClick={() => onChange({ telemetryType: type })}
            >
              <Text size="sm" fw={500} style={{ color: 'var(--color-text)' }}>
                {type.toUpperCase()}
              </Text>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {telemetryType === TelemetryType.UNIFIED && (
        <Box mt="md">
          <Text size="sm" fw={500} mb="xs" style={{ color: 'var(--color-text)' }}>
            Generate Together
          </Text>
          <Grid>
            <Grid.Col span={3}>
              <Switch
                label="Traces"
                checked={includeTraces}
                onChange={(e) => onChange({ includeTraces: e.currentTarget.checked })}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <Switch
                label="Metrics"
                checked={includeMetrics}
                onChange={(e) => onChange({ includeMetrics: e.currentTarget.checked })}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <Switch
                label="Logs"
                checked={includeLogs}
                onChange={(e) => onChange({ includeLogs: e.currentTarget.checked })}
              />
            </Grid.Col>
          </Grid>
          <Switch
            mt="xs"
            label="Correlate (share trace_id, span_id)"
            checked={correlationEnabled}
            onChange={(e) => onChange({ correlationEnabled: e.currentTarget.checked })}
          />
        </Box>
      )}
    </Card>
  );
}
