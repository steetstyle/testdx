import {
  Stack, Grid, TextInput, Select, NumberInput,
  Divider, Text, Group, ActionIcon, Button,
  Card, Badge, MultiSelect, Collapse
} from '@mantine/core';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import {
  MetricPoint,
  MetricType,
  MetricTemporality,
  AggregationType,
  MetricReaderType
} from '../types';

interface MetricsEditorProps {
  metrics: MetricPoint[];
  temporality: MetricTemporality;
  aggregation: AggregationType;
  readers: MetricReaderType[];
  metricAttributes: Record<string, string>;
  onUpdateMetrics: (metrics: MetricPoint[]) => void;
  onUpdateTemporality: (t: MetricTemporality) => void;
  onUpdateAggregation: (a: AggregationType) => void;
  onUpdateReaders: (readers: MetricReaderType[]) => void;
  onUpdateMetricAttributes: (attrs: Record<string, string>) => void;
}

const metricTypeOptions = Object.values(MetricType).map(t => ({ value: t, label: t }));
const temporalityOptions = Object.values(MetricTemporality).map(t => ({ value: t, label: t }));
const aggregationOptions = Object.values(AggregationType).map(a => ({ value: a, label: a }));
const readerOptions = Object.values(MetricReaderType).map(r => ({ value: r, label: r }));

interface MetricCardProps {
  metric: MetricPoint;
  onUpdate: (updates: Partial<MetricPoint>) => void;
  onDelete: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

function MetricCard({ metric, onUpdate, onDelete, expanded, onToggleExpand }: MetricCardProps) {
  return (
    <Card withBorder padding="sm" style={{ backgroundColor: 'var(--color-bg-muted)' }}>
      <Group justify="space-between" onClick={onToggleExpand} style={{ cursor: 'pointer' }}>
        <Group gap="xs">
          <ActionIcon variant="subtle" size="sm">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </ActionIcon>
          <Text size="sm" fw={500}>{metric.name}</Text>
          <Badge size="xs" variant="light">{metric.type}</Badge>
        </Group>
        <ActionIcon
          variant="subtle"
          color="red"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={12} />
        </ActionIcon>
      </Group>

      <Collapse in={expanded}>
        <Grid mt="sm">
          <Grid.Col span={5}>
            <TextInput
              label="Name"
              value={metric.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              size="sm"
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <Select
              label="Type"
              data={metricTypeOptions}
              value={metric.type}
              onChange={(val) => onUpdate({ type: val as MetricType })}
              size="sm"
            />
          </Grid.Col>
          <Grid.Col span={2}>
            <TextInput
              label="Unit"
              value={metric.unit}
              onChange={(e) => onUpdate({ unit: e.target.value })}
              size="sm"
            />
          </Grid.Col>
          <Grid.Col span={2}>
            <NumberInput
              label="Value"
              value={metric.value}
              onChange={(val) => onUpdate({ value: Number(val) })}
              size="sm"
            />
          </Grid.Col>
        </Grid>

        <Divider my="sm" label="Labels" labelPosition="left" />

        <Stack gap="xs">
          {Object.entries(metric.labels || {}).map(([key, value]) => (
            <Group key={key} gap="xs">
              <TextInput
                placeholder="Key"
                value={key}
                onChange={(e) => {
                  const newLabels = { ...metric.labels };
                  delete newLabels[key];
                  newLabels[e.target.value] = value;
                  onUpdate({ labels: newLabels });
                }}
                size="xs"
                style={{ flex: 1 }}
              />
              <TextInput
                placeholder="Value"
                value={value}
                onChange={(e) => {
                  onUpdate({ labels: { ...metric.labels, [key]: e.target.value } });
                }}
                size="xs"
                style={{ flex: 1 }}
              />
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => {
                  const newLabels = { ...metric.labels };
                  delete newLabels[key];
                  onUpdate({ labels: newLabels });
                }}
              >
                <Trash2 size={12} />
              </ActionIcon>
            </Group>
          ))}
          <Button
            variant="subtle"
            size="xs"
            leftSection={<Plus size={12} />}
            onClick={() => {
              onUpdate({ labels: { ...metric.labels, ['']: '' } });
            }}
          >
            Add Label
          </Button>
        </Stack>

        {metric.type === MetricType.HISTOGRAM && (
          <>
            <Divider my="sm" label="Histogram Buckets" labelPosition="left" />
            <TextInput
              label="Bucket Boundaries (comma-separated)"
              value={(metric.histogramBuckets || []).join(', ')}
              onChange={(e) => {
                const buckets = e.target.value
                  .split(',')
                  .map(s => parseFloat(s.trim()))
                  .filter(n => !isNaN(n));
                onUpdate({ histogramBuckets: buckets });
              }}
              size="sm"
              placeholder="0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10"
            />
          </>
        )}
      </Collapse>
    </Card>
  );
}

export function MetricsEditor({
  metrics,
  temporality,
  aggregation,
  readers,
  metricAttributes,
  onUpdateMetrics,
  onUpdateTemporality,
  onUpdateAggregation,
  onUpdateReaders,
  onUpdateMetricAttributes,
}: MetricsEditorProps) {
  const [expandedMetrics, setExpandedMetrics] = useState<Set<number>>(new Set([0]));

  const handleAddMetric = () => {
    const newMetric: MetricPoint = {
      name: 'custom.metric',
      type: MetricType.COUNTER,
      value: 1,
      unit: '1',
      labels: {},
    };
    onUpdateMetrics([...metrics, newMetric]);
    setExpandedMetrics(prev => new Set([...prev, metrics.length]));
  };

  const handleUpdateMetric = (idx: number, updates: Partial<MetricPoint>) => {
    const newMetrics = [...metrics];
    newMetrics[idx] = { ...newMetrics[idx], ...updates };
    onUpdateMetrics(newMetrics);
  };

  const handleDeleteMetric = (idx: number) => {
    const newMetrics = metrics.filter((_, i) => i !== idx);
    onUpdateMetrics(newMetrics);
    const newExpanded = new Set(expandedMetrics);
    newExpanded.delete(idx);
    setExpandedMetrics(newExpanded);
  };

  const toggleExpand = (idx: number) => {
    setExpandedMetrics(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <Stack gap="md">
      <Card withBorder padding="md">
        <Text fw={500} mb="md">Metric Settings</Text>
        <Grid>
          <Grid.Col span={4}>
            <Select
              label="Temporality"
              data={temporalityOptions}
              value={temporality}
              onChange={(val) => onUpdateTemporality(val as MetricTemporality)}
              size="sm"
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label="Aggregation"
              data={aggregationOptions}
              value={aggregation}
              onChange={(val) => onUpdateAggregation(val as AggregationType)}
              size="sm"
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <MultiSelect
              label="Readers"
              data={readerOptions}
              value={readers}
              onChange={(val) => onUpdateReaders(val as MetricReaderType[])}
              size="sm"
            />
          </Grid.Col>
        </Grid>
      </Card>

      <Card withBorder padding="md">
        <Group justify="space-between" mb="md">
          <Text fw={500}>Metric Points</Text>
          <Button
            size="xs"
            variant="light"
            leftSection={<Plus size={12} />}
            onClick={handleAddMetric}
          >
            Add Metric
          </Button>
        </Group>

        <Stack gap="sm">
          {metrics.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">
              No metrics configured. Add a metric to get started.
            </Text>
          ) : (
            metrics.map((metric, idx) => (
              <MetricCard
                key={idx}
                metric={metric}
                onUpdate={(updates) => handleUpdateMetric(idx, updates)}
                onDelete={() => handleDeleteMetric(idx)}
                expanded={expandedMetrics.has(idx)}
                onToggleExpand={() => toggleExpand(idx)}
              />
            ))
          )}
        </Stack>
      </Card>

      <Card withBorder padding="md">
        <Text fw={500} mb="md">Metric Attributes (Resource)</Text>
        <Stack gap="xs">
          {Object.entries(metricAttributes).map(([key, value]) => (
            <Group key={key} gap="xs">
              <TextInput
                placeholder="Key"
                value={key}
                onChange={(e) => {
                  const newAttrs = { ...metricAttributes };
                  delete newAttrs[key];
                  newAttrs[e.target.value] = value;
                  onUpdateMetricAttributes(newAttrs);
                }}
                size="sm"
                style={{ flex: 1 }}
              />
              <TextInput
                placeholder="Value"
                value={value}
                onChange={(e) => {
                  onUpdateMetricAttributes({ ...metricAttributes, [key]: e.target.value });
                }}
                size="sm"
                style={{ flex: 1 }}
              />
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => {
                  const newAttrs = { ...metricAttributes };
                  delete newAttrs[key];
                  onUpdateMetricAttributes(newAttrs);
                }}
              >
                <Trash2 size={12} />
              </ActionIcon>
            </Group>
          ))}
          <Button
            variant="subtle"
            size="xs"
            leftSection={<Plus size={12} />}
            onClick={() => onUpdateMetricAttributes({ ...metricAttributes, ['']: '' })}
          >
            Add Attribute
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}

export default MetricsEditor;
