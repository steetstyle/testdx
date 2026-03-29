import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Clock, CheckCircle, XCircle, ExternalLink,
  Calendar, Activity, ArrowLeft
} from 'lucide-react';
import { 
  Card, Text, Badge, Group, Button, ActionIcon, 
  Box, Stack, Loader, Title
} from '@mantine/core';
import { syntheticApi } from '../services/api';
import { RunHistoryEntry, RunStatus } from '../types';
import { format, formatDistanceToNow } from 'date-fns';

const STATUS_COLORS: Record<RunStatus, string> = {
  success: 'green',
  failed: 'red',
  running: 'yellow',
};

function RunHistoryTimeline({ 
  history, 
  scenarioId 
}: { 
  history: RunHistoryEntry[];
  scenarioId: string;
}) {
  const hyperDxUrl = import.meta.env.VITE_HYPERDX_URL || 'https://app.hyperdx.io';

  const getStatusIcon = (status: RunStatus) => {
    switch (status) {
      case RunStatus.SUCCESS:
        return <CheckCircle size={16} color="var(--color-text-success)" />;
      case RunStatus.FAILED:
        return <XCircle size={16} color="var(--color-text-danger)" />;
      case RunStatus.RUNNING:
        return <Clock size={16} color="var(--color-bg-warning)" className="animate-pulse" />;
      default:
        return <Clock size={16} color="var(--color-text-muted)" />;
    }
  };

  return (
    <Box style={{ position: 'relative' }}>
      <Box style={{ 
        position: 'absolute', 
        left: 24, 
        top: 0, 
        bottom: 0, 
        width: 2, 
        backgroundColor: 'var(--color-border)' 
      }} />
      <Stack gap="lg">
        {history.map((entry, index) => (
          <Box key={index} style={{ position: 'relative', paddingLeft: 40 }}>
            <Box style={{ 
              position: 'absolute', 
              left: 16, 
              top: 16, 
              width: 16, 
              height: 16, 
              borderRadius: '50%', 
              backgroundColor: 'var(--color-bg-body)',
              border: '2px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}>
              {getStatusIcon(entry.status)}
            </Box>
            <Card padding="md" radius="md" withBorder ml="md">
              <Group justify="space-between" mb="xs">
                <Group>
                  <Badge 
                    variant="filled" 
                    color={STATUS_COLORS[entry.status]}
                    size="sm"
                  >
                    {entry.status}
                  </Badge>
                  <Text size="xs" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)' }}>
                    <Calendar size={12} />
                    {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm')}
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                </Text>
              </Group>
              
              <Group gap="md" mb="xs" style={{ color: 'var(--color-text-muted)' }}>
                <Text size="sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Activity size={14} />
                  {entry.recordsGenerated.toLocaleString()} records
                </Text>
                <Text size="sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={14} />
                  {entry.mode}
                </Text>
              </Group>

              {entry.error && (
                <Text size="sm" c="red" mt="sm" p="xs" style={{ backgroundColor: 'var(--color-bg-danger)', borderRadius: 4 }}>
                  {entry.error}
                </Text>
              )}

              <Group mt="sm">
                <Button
                  variant="subtle"
                  size="xs"
                  leftSection={<ExternalLink size={12} />}
                  component="a"
                  href={`${hyperDxUrl}/search?trace_id=${entry.timestamp}`}
                  target="_blank"
                >
                  View in HyperDX
                </Button>
              </Group>
            </Card>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export function RunHistory() {
  const { id } = useParams<{ id: string }>();
  const [history, setHistory] = useState<RunHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadHistory();
    }
  }, [id]);

  const loadHistory = async () => {
    try {
      const data = await syntheticApi.getHistory(id!);
      setHistory(data);
    } catch (err) {
      setError('Failed to load history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Stack align="center" py="xl">
        <Loader color="green" />
      </Stack>
    );
  }

  if (error) {
    return (
      <Text c="red" ta="center" py="xl">{error}</Text>
    );
  }

  if (history.length === 0) {
    return (
      <Stack align="center" py="xl">
        <Box style={{ padding: 16, borderRadius: '50%', backgroundColor: 'var(--color-bg-muted)' }}>
          <Clock size={48} style={{ color: 'var(--color-text-muted)' }} />
        </Box>
        <Title order={4} style={{ color: 'var(--color-text)' }}>No runs yet</Title>
        <Text c="dimmed" size="sm">Run the scenario to see history</Text>
      </Stack>
    );
  }

  return (
    <Box p="md">
      <Group mb="md">
        <ActionIcon variant="subtle" component={Link} to="/synthetic" size="lg">
          <ArrowLeft size={20} />
        </ActionIcon>
        <Title order={3} style={{ color: 'var(--color-text)' }}>Run History</Title>
      </Group>
      <RunHistoryTimeline history={history} scenarioId={id!} />
    </Box>
  );
}

export default RunHistory;