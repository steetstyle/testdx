import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Box, Group, Title, Text, Button, Card, Stack, Loader, Grid, Menu } from '@mantine/core';
import { Plus, FileUp, Server, Zap, BarChart3, Square, Calendar, Play, Pause } from 'lucide-react';
import { serviceApi, scenarioApi } from '../../services/api';
import { ScenarioCard } from '../../components/ScenarioCard';
import type { Service, SyntheticScenario } from '../../types';
import type { GlobalVariables } from '../../services/variables/types';

export function ScenariosPage() {
  const { projectId: projectIdParam, serviceId: serviceIdParam } = useParams<{ projectId: string; serviceId: string }>();
  const projectId = projectIdParam || '';
  const serviceId = serviceIdParam || '';
  const [scenarios, setScenarios] = useState<SyntheticScenario[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const loadData = async () => {
    try {
      const [serviceData, scenariosData] = await Promise.all([
        serviceApi.getService(serviceId),
        scenarioApi.getScenarios(projectId, serviceId),
      ]);
      setService(serviceData);
      setScenarios(scenariosData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId, serviceId]);

  const handleRun = async (id: string, mode?: 'realtime' | 'historical', duration?: number, timeRange?: { start: string; end: string }) => {
    try {
      const input = mode === 'historical' && timeRange
        ? { mode, timeRange }
        : { mode: mode || 'realtime', duration: mode === 'realtime' ? duration : undefined };
      await scenarioApi.runScenario(id, input);
      await loadData();
    } catch (err) {
      console.error('Failed to run scenario:', err);
    }
  };

  const handleStop = async (id: string) => {
    try {
      await scenarioApi.stopScenario(id);
      await loadData();
    } catch (err) {
      console.error('Failed to stop scenario:', err);
    }
  };

  const handleStartSchedule = async (id: string) => {
    try {
      await scenarioApi.startSchedule(id);
      await loadData();
    } catch (err) {
      console.error('Failed to start schedule:', err);
    }
  };

  const handleStopSchedule = async (id: string) => {
    try {
      await scenarioApi.stopSchedule(id);
      await loadData();
    } catch (err) {
      console.error('Failed to stop schedule:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await scenarioApi.deleteScenario(id);
      setScenarios(scenarios.filter(s => s._id !== id));
    } catch (err) {
      console.error('Failed to delete scenario:', err);
    }
  };

  const runningScenarios = scenarios.filter(s => s.currentRunProgress?.status === 'running');
  const scheduledScenarios = scenarios.filter(s => s.schedule?.enabled);
  const hasScheduledScenarios = scheduledScenarios.length > 0;

  const handleStopAllRunning = async () => {
    for (const scenario of runningScenarios) {
      try {
        await scenarioApi.stopScenario(scenario._id);
      } catch (err) {
        console.error(`Failed to stop scenario ${scenario.name}:`, err);
      }
    }
    await loadData();
  };

  const handleToggleAllSchedules = async () => {
    if (hasScheduledScenarios) {
      for (const scenario of scheduledScenarios) {
        try {
          await scenarioApi.stopSchedule(scenario._id);
        } catch (err) {
          console.error(`Failed to stop schedule for ${scenario.name}:`, err);
        }
      }
    } else {
      for (const scenario of scenarios) {
        if (!scenario.schedule?.enabled && scenario.schedule) {
          try {
            await scenarioApi.startSchedule(scenario._id);
          } catch (err) {
            console.error(`Failed to start schedule for ${scenario.name}:`, err);
          }
        }
      }
    }
    await loadData();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      await scenarioApi.importYaml(text);
      await loadData();
    } catch (err) {
      console.error('Failed to import:', err);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-body)' }}>
      <Box
        component="header"
        style={{
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-header)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Group justify="space-between" p="md" maw={1200} mx="auto">
          <Group>
            <Button
              variant="subtle"
              component={Link}
              to={`/synthetic/${projectId}`}
              size="lg"
              style={{ padding: '4px 8px' }}
            >
              <Server size={20} />
            </Button>
            <div>
              <Title order={3} style={{ color: 'var(--color-text)' }}>
                {service?.name || 'Scenarios'}
              </Title>
              <Text size="sm" c="dimmed">
                OTel Config: {service?.otelSdkConfig?.trace?.endpoint}
              </Text>
            </div>
          </Group>
          <Group gap="sm">
            <Button
              variant="secondary"
              leftSection={<FileUp size={16} />}
              component="label"
              style={{ cursor: 'pointer' }}
            >
              Import YAML
              <input
                type="file"
                accept=".yaml,.yml"
                onChange={handleImport}
                style={{ display: 'none' }}
                disabled={importing}
              />
            </Button>
            <Button
              variant="primary"
              leftSection={<Plus size={16} />}
              component={Link}
              to={`/synthetic/${projectId}/services/${serviceId}/scenarios/new`}
            >
              New Scenario
            </Button>
          </Group>
        </Group>
      </Box>

      <Box p="md" maw={1200} mx="auto">
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card padding="md" radius="md" withBorder>
              <Group>
                <Box style={{ padding: 8, borderRadius: 8, backgroundColor: 'var(--color-primary-button-bg)', opacity: 0.2 }}>
                  <Zap size={20} style={{ color: 'var(--color-primary-button-text)' }} />
                </Box>
                <div>
                  <Text size="xl" fw={700} style={{ color: 'var(--color-text)' }}>
                    {scenarios.length}
                  </Text>
                  <Text size="sm" c="dimmed">Total Scenarios</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card padding="md" radius="md" withBorder>
              <Group justify="space-between">
                <Group>
                  <Box style={{ padding: 8, borderRadius: 8, backgroundColor: 'orange', opacity: 0.2 }}>
                    <Square size={20} style={{ color: 'orange' }} />
                  </Box>
                  <div>
                    <Text size="xl" fw={700} style={{ color: 'var(--color-text)' }}>
                      {runningScenarios.length}
                    </Text>
                    <Text size="sm" c="dimmed">Running</Text>
                  </div>
                </Group>
                {runningScenarios.length > 0 && (
                  <Button
                    size="xs"
                    variant="danger"
                    onClick={handleStopAllRunning}
                  >
                    Stop All
                  </Button>
                )}
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card padding="md" radius="md" withBorder>
              <Group justify="space-between">
                <Group>
                  <Box style={{ padding: 8, borderRadius: 8, backgroundColor: 'green', opacity: 0.2 }}>
                    <Calendar size={20} style={{ color: 'green' }} />
                  </Box>
                  <div>
                    <Text size="xl" fw={700} style={{ color: 'var(--color-text)' }}>
                      {scheduledScenarios.length}
                    </Text>
                    <Text size="sm" c="dimmed">Scheduled</Text>
                  </div>
                </Group>
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <Button size="xs" variant="secondary">
                      {hasScheduledScenarios ? 'Disable All' : 'Enable All'}
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={hasScheduledScenarios ? <Pause size={14} /> : <Play size={14} />}
                      onClick={handleToggleAllSchedules}
                    >
                      {hasScheduledScenarios ? 'Disable All Schedules' : 'Enable All Schedules'}
                    </Menu.Item>
                    {hasScheduledScenarios && (
                      <>
                        <Menu.Divider />
                        <Menu.Label>Individual Schedules</Menu.Label>
                        {scheduledScenarios.map(s => (
                          <Menu.Item
                            key={s._id}
                            onClick={() => handleStopSchedule(s._id)}
                          >
                            Stop: {s.name}
                          </Menu.Item>
                        ))}
                      </>
                    )}
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {loading ? (
          <Stack align="center" py="xl">
            <Loader color="green" />
          </Stack>
        ) : scenarios.length === 0 ? (
          <Stack align="center" py="xl">
            <Box style={{ padding: 16, borderRadius: '50%', backgroundColor: 'var(--color-bg-muted)' }}>
              <BarChart3 size={32} style={{ color: 'var(--color-text-muted)' }} />
            </Box>
            <Title order={4} style={{ color: 'var(--color-text)' }}>No scenarios yet</Title>
            <Text c="dimmed" mb="md">Create your first synthetic monitoring scenario</Text>
            <Button
              variant="primary"
              leftSection={<Plus size={16} />}
              component={Link}
              to={`/synthetic/${projectId}/services/${serviceId}/scenarios/new`}
            >
              Create Scenario
            </Button>
          </Stack>
        ) : (
          <Grid>
            {scenarios.map(scenario => (
              <Grid.Col key={scenario._id} span={{ base: 12, md: 6, lg: 4 }}>
                <ScenarioCard
                  scenario={scenario}
                  onRun={handleRun}
                  onStop={handleStop}
                  onDelete={handleDelete}
                  inheritedProjectVariables={service?.project?.projectVariables}
                  inheritedServiceVariables={service?.serviceVariables}
                />
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
