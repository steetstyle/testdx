import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Text, Group, Button, ActionIcon, Box, Modal, Stack, SegmentedControl, NumberInput, TextInput, Progress, Loader } from '@mantine/core';
import { Play, Pause, Trash2, BarChart3, Zap, Calendar, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from './StatusBadge';
import { VariablesSummary } from './VariablesEditor';
import { useDeleteConfirm, useProgressPolling } from '../hooks';
import type { SyntheticScenario, RunProgress, DistributionConfig, FixedConfig, UniformConfig, GaussianConfig, LinearRampConfig, ExponentialRampConfig, SineWaveConfig, SquareWaveConfig, TriangleWaveConfig, BurstConfig, PoissonConfig, ExponentialConfig } from '../types';
import type { GlobalVariables } from '../services/variables/types';

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

interface ScenarioCardProps {
  scenario: SyntheticScenario;
  onRun: (id: string, mode?: 'realtime' | 'historical', duration?: number, timeRange?: { start: string; end: string }) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
  inheritedProjectVariables?: GlobalVariables;
  inheritedServiceVariables?: GlobalVariables;
}

const DELETE_TITLE = 'Delete Scenario?';
const DELETE_MESSAGE = 'This action cannot be undone.';

export function ScenarioCard({
  scenario,
  onRun,
  onStop,
  onDelete,
  inheritedProjectVariables,
  inheritedServiceVariables,
}: ScenarioCardProps) {
  const [showRunOptions, setShowRunOptions] = useState(false);
  const [runMode, setRunMode] = useState<'realtime' | 'historical'>('realtime');
  const [duration, setDuration] = useState(60);
  const [histStart, setHistStart] = useState('');
  const [histEnd, setHistEnd] = useState('');
  const [localProgress, setLocalProgress] = useState<RunProgress | null>(scenario.currentRunProgress || null);

  const progressPolling = useProgressPolling();
  const deleteConfirm = useDeleteConfirm({
    title: DELETE_TITLE,
    message: DELETE_MESSAGE,
    onConfirm: async () => {
      await onDelete(scenario._id);
    },
  });

  useEffect(() => {
    if (scenario.currentRunProgress?.status === 'running') {
      setLocalProgress(scenario.currentRunProgress);
      if (!progressPolling.isPolling) {
        progressPolling.startPolling(scenario._id);
      }
    }
  }, [scenario.currentRunProgress]);

  useEffect(() => {
    if (progressPolling.progress) {
      setLocalProgress(progressPolling.progress);
    }
  }, [progressPolling.progress]);

  const handleRun = async () => {
    const timeRange = runMode === 'historical' && histStart && histEnd
      ? { start: histStart, end: histEnd }
      : undefined;
    await onRun(scenario._id, runMode, runMode === 'realtime' ? duration : undefined, timeRange);
    progressPolling.startPolling(scenario._id);
    setShowRunOptions(false);
  };

  const progress = localProgress || scenario.currentRunProgress;
  const isRunning = progress?.status === 'running';

  return (
    <>
      <Card padding="md" radius="md" withBorder>
        <Group justify="space-between" mb="xs">
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Text fw={500} truncate style={{ color: 'var(--color-text)' }}>
              {scenario.name}
            </Text>
            <Text size="sm" c="dimmed" truncate>
              {scenario.description || 'No description'}
            </Text>
          </Box>
          <StatusBadge status={scenario.lastRunStatus} />
        </Group>

        <Group gap="lg" mb="md" style={{ color: 'var(--color-text-muted)' }}>
          <Text size="xs" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <BarChart3 size={14} />
            {scenario.telemetryType}
          </Text>
          <Text size="xs" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Zap size={14} />
            {scenario.distribution?.type || 'uniform'}
          </Text>
          <Text size="xs" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Activity size={14} />
            {getRateFromDistribution(scenario.distribution)}/s
          </Text>
          {scenario.schedule?.enabled && (
            <Text size="xs" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={14} />
              {scenario.schedule.cronExpression || 'scheduled'}
            </Text>
          )}
        </Group>

        {(scenario.variables && Object.keys(scenario.variables).length > 0) && (
          <Box mb="sm">
            <Group gap={4} mb={4}>
              <Text size="xs" c="dimmed">Scenario vars:</Text>
              <VariablesSummary variables={scenario.variables} maxShow={3} />
            </Group>
          </Box>
        )}

        {(inheritedProjectVariables && Object.keys(inheritedProjectVariables).length > 0) && (
          <Box mb="sm">
            <Group gap={4}>
              <Text size="xs" c="dimmed">Project vars:</Text>
              <VariablesSummary variables={inheritedProjectVariables} maxShow={2} />
            </Group>
          </Box>
        )}

        {(inheritedServiceVariables && Object.keys(inheritedServiceVariables).length > 0) && (
          <Box mb="sm">
            <Group gap={4}>
              <Text size="xs" c="dimmed">Service vars:</Text>
              <VariablesSummary variables={inheritedServiceVariables} maxShow={2} />
            </Group>
          </Box>
        )}

        {scenario.lastRunAt && (
          <Text size="xs" c="dimmed" mb="md">
            Last run: {formatDistanceToNow(new Date(scenario.lastRunAt), { addSuffix: true })}
          </Text>
        )}

        {isRunning && (
          <Box mb="md" p="sm" style={{ backgroundColor: 'var(--color-progress-bg)', borderRadius: 8 }}>
            <Group justify="space-between" mb="xs">
              <Text size="xs" fw={500} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Loader size={12} />
                Running... {progress?.mode}
                {progress?.duration && ` (${progress.duration}s)`}
              </Text>
              <Text size="xs" c="dimmed">
                {progress?.totalRecords || 0} / {progress?.totalExpected || '?'} records
              </Text>
            </Group>
            <Progress
              value={((progress?.totalRecords || 0) / (progress?.totalExpected || 1)) * 100}
              size="sm"
              color="green"
              animated
            />
            <Group gap="lg" mt="xs">
              <Text size="xs" c="dimmed">
                Traces: {progress?.tracesGenerated || 0}
              </Text>
              <Text size="xs" c="dimmed">
                Metrics: {progress?.metricsGenerated || 0}
              </Text>
              <Text size="xs" c="dimmed">
                Logs: {progress?.logsGenerated || 0}
              </Text>
            </Group>
          </Box>
        )}

        {showRunOptions && (
          <Box mb="md" p="sm" style={{ backgroundColor: 'var(--color-bg-surface)', borderRadius: 8 }}>
            <SegmentedControl
              size="xs"
              fullWidth
              data={[
                { value: 'realtime', label: 'Realtime' },
                { value: 'historical', label: 'Historical' },
              ]}
              value={runMode}
              onChange={(val) => setRunMode(val as 'realtime' | 'historical')}
              mb="sm"
            />
            {runMode === 'realtime' && (
              <NumberInput
                size="xs"
                label="Duration (seconds)"
                value={duration}
                onChange={(val) => setDuration(Number(val) || 60)}
                min={1}
                max={3600}
                mb="xs"
              />
            )}
            {runMode === 'historical' && (
              <Stack gap="xs">
                <TextInput
                  size="xs"
                  label="Start"
                  type="datetime-local"
                  value={histStart}
                  onChange={(e) => setHistStart(e.target.value)}
                />
                <TextInput
                  size="xs"
                  label="End"
                  type="datetime-local"
                  value={histEnd}
                  onChange={(e) => setHistEnd(e.target.value)}
                />
              </Stack>
            )}
          </Box>
        )}

        <Group gap="xs">
          {showRunOptions ? (
            <>
              <Button
                size="xs"
                variant="primary"
                leftSection={<Play size={14} />}
                onClick={handleRun}
              >
                Confirm
              </Button>
              <Button
                size="xs"
                variant="secondary"
                onClick={() => setShowRunOptions(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              size="xs"
              variant="primary"
              leftSection={<Play size={14} />}
              onClick={() => setShowRunOptions(true)}
            >
              Run
            </Button>
          )}

          <Button
            size="xs"
            variant="secondary"
            component={Link}
            to={`/synthetic/${scenario.projectId}/services/${scenario.serviceId}/scenarios/${scenario._id}`}
          >
            Edit
          </Button>

          <ActionIcon
            size="sm"
            variant="subtle"
            color="red"
            onClick={deleteConfirm.confirmDelete}
            ml="auto"
          >
            <Trash2 size={14} />
          </ActionIcon>
        </Group>
      </Card>

      <Modal
        opened={deleteConfirm.showDelete}
        onClose={deleteConfirm.cancelDelete}
        title={DELETE_TITLE}
        centered
      >
        <Text size="sm" mb="lg" c="dimmed">
          {DELETE_MESSAGE}
        </Text>
        <Group justify="flex-end">
          <Button variant="secondary" onClick={deleteConfirm.cancelDelete}>
            Cancel
          </Button>
          <Button color="red" onClick={deleteConfirm.handleDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
}
