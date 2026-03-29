import { Card, Text, Stack, Group, Divider, SegmentedControl, TextInput, Button, Progress, Box, NumberInput } from '@mantine/core';
import { Play, Square } from 'lucide-react';
import { Loader as MantineLoader } from '@mantine/core';
import { DistributionPreview } from '../../../components/DistributionPreview';
import type { ScenarioFormData } from '../hooks/useScenarioForm';
import { RunMode, DistributionConfig, FixedConfig, UniformConfig, GaussianConfig, LinearRampConfig, ExponentialRampConfig, SineWaveConfig, SquareWaveConfig, TriangleWaveConfig, BurstConfig, PoissonConfig, ExponentialConfig } from '../../../types';
import type { RunProgress } from '../../../types';

const getRateFromDistribution = (distribution: DistributionConfig | undefined): number => {
  if (!distribution) return 10;
  switch (distribution.type) {
    case 'fixed':
      return (distribution as FixedConfig).rate ?? 10;
    case 'uniform':
      return (((distribution as UniformConfig).min ?? 1) + ((distribution as UniformConfig).max ?? 10)) / 2;
    case 'gaussian':
      return (distribution as GaussianConfig).mean ?? 10;
    case 'linearRamp':
    case 'exponentialRamp':
      return (((distribution as LinearRampConfig).start ?? 5) + ((distribution as LinearRampConfig).end ?? 20)) / 2;
    case 'sine':
      return (distribution as SineWaveConfig).base ?? 10;
    case 'square':
    case 'triangle':
      return (((distribution as SquareWaveConfig).min ?? 5) + ((distribution as SquareWaveConfig).max ?? 20)) / 2;
    case 'burst':
      return (distribution as BurstConfig).baseRate ?? 5;
    case 'poisson':
      return (distribution as PoissonConfig).lambda ?? 10;
    case 'exponential':
      return (distribution as ExponentialConfig).lambda ?? 1;
    default:
      return 10;
  }
};

interface RunSummaryPanelProps {
  formData: ScenarioFormData;
  progress: RunProgress | null;
  onRun: () => void;
  onStop: () => void;
  onUpdateFormData: (updates: Partial<ScenarioFormData>) => void;
  loading?: boolean;
  stopping?: boolean;
}

export function RunSummaryPanel({
  formData,
  progress,
  onRun,
  onStop,
  onUpdateFormData,
  loading = false,
  stopping = false,
}: RunSummaryPanelProps) {
  const isRunning = progress?.status === 'running';

  return (
    <Card padding="md" radius="md" withBorder style={{ position: 'sticky', top: 80 }}>
      <Text fw={500} mb="md" style={{ color: 'var(--color-text)' }}>Summary</Text>
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">Name</Text>
          <Text size="sm" style={{ color: 'var(--color-text)' }}>{formData.name || '-'}</Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">Type</Text>
          <Text size="sm" style={{ color: 'var(--color-text)' }}>{formData.telemetryType}</Text>
        </Group>
        <Divider my="xs" />
        <Group justify="space-between">
          <Text size="sm" c="dimmed">Traces</Text>
          <Text size="sm" style={{ color: formData.includeTraces ? 'green' : 'dimmed' }}>
            {formData.telemetryType === 'unified' ? (formData.includeTraces ? 'On' : 'Off') : (formData.telemetryType === 'traces' ? 'On' : 'Off')}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">Metrics</Text>
          <Text size="sm" style={{ color: formData.includeMetrics ? 'green' : 'dimmed' }}>
            {formData.telemetryType === 'unified' ? (formData.includeMetrics ? 'On' : 'Off') : (formData.telemetryType === 'metrics' ? 'On' : 'Off')}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">Logs</Text>
          <Text size="sm" style={{ color: formData.includeLogs ? 'green' : 'dimmed' }}>
            {formData.telemetryType === 'unified' ? (formData.includeLogs ? 'On' : 'Off') : (formData.telemetryType === 'logs' ? 'On' : 'Off')}
          </Text>
        </Group>
        <Divider my="xs" />
        <Group justify="space-between">
          <Text size="sm" c="dimmed">Rate</Text>
          <Text size="sm" style={{ color: 'var(--color-text)' }}>{getRateFromDistribution(formData.distribution)}/s</Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">Spans</Text>
          <Text size="sm" style={{ color: 'var(--color-text)' }}>{formData.traceConfig.spans?.length ?? 0}</Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">Metrics Count</Text>
          <Text size="sm" style={{ color: 'var(--color-text)' }}>{formData.metricConfig.metrics?.length ?? 0}</Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">Logs Count</Text>
          <Text size="sm" style={{ color: 'var(--color-text)' }}>{formData.logConfig.logs?.length ?? 0}</Text>
        </Group>
      </Stack>

      <Divider my="md" />

      <DistributionPreview
        distribution={formData.distribution}
        samples={20}
      />

      <Divider my="md" />

      {formData.runMode === 'realtime' && (
        <NumberInput
          size="xs"
          label="Duration (seconds)"
          value={formData.duration ?? 60}
          onChange={(val) => onUpdateFormData({ duration: Number(val) })}
          min={1}
          description="Run duration in seconds"
          disabled={isRunning}
        />
      )}

      <Stack gap="xs">
        <Text size="sm" fw={500} style={{ color: 'var(--color-text)' }}>Run Mode</Text>
        <SegmentedControl
          size="xs"
          fullWidth
          data={[
            { value: 'realtime', label: 'Realtime' },
            { value: 'historical', label: 'Historical' },
          ]}
          value={formData.runMode}
          onChange={(val) => onUpdateFormData({ runMode: val as RunMode })}
          disabled={isRunning}
        />

        {formData.runMode === 'historical' && (
          <Stack gap="xs" mt="xs">
            <TextInput
              size="xs"
              label="Start Date/Time"
              type="datetime-local"
              value={formData.timeRange?.start || ''}
              onChange={(e) => onUpdateFormData({
                timeRange: { start: e.target.value, end: formData.timeRange?.end || '' }
              })}
              disabled={isRunning}
            />
            <TextInput
              size="xs"
              label="End Date/Time"
              type="datetime-local"
              value={formData.timeRange?.end || ''}
              onChange={(e) => onUpdateFormData({
                timeRange: { start: formData.timeRange?.start || '', end: e.target.value }
              })}
              disabled={isRunning}
            />
          </Stack>
        )}
      </Stack>

      <Divider my="md" />

      {isRunning ? (
        <Button
          fullWidth
          variant="danger"
          leftSection={<Square size={16} />}
          onClick={onStop}
          loading={stopping}
        >
          Stop Scenario
        </Button>
      ) : (
        <Button
          fullWidth
          variant="primary"
          leftSection={<Play size={16} />}
          onClick={onRun}
          loading={loading}
        >
          Run Scenario
        </Button>
      )}

      {isRunning && (
        <Box mt="md" p="sm" style={{ backgroundColor: 'var(--color-progress-bg)', borderRadius: 8 }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={500} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MantineLoader size={12} />
              Running... {progress.mode}
              {progress.duration && ` (${progress.duration}s)`}
            </Text>
            <Text size="xs" c="dimmed">
              {progress.totalRecords || 0} / {progress.totalExpected || '?'} records
            </Text>
          </Group>
          <Progress
            value={((progress.totalRecords || 0) / (progress.totalExpected || 1)) * 100}
            size="sm"
            color="green"
            animated
          />
          <Group gap="lg" mt="xs">
            <Text size="xs" c="dimmed">
              Traces: {progress.tracesGenerated || 0}
            </Text>
            <Text size="xs" c="dimmed">
              Metrics: {progress.metricsGenerated || 0}
            </Text>
            <Text size="xs" c="dimmed">
              Logs: {progress.logsGenerated || 0}
            </Text>
          </Group>
        </Box>
      )}
    </Card>
  );
}