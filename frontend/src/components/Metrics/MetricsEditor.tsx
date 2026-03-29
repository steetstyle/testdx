import { Stack, Card, Text, Group, Button, Text as MantineText } from '@mantine/core';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { MetricPoint, MetricTemporality, AggregationType, MetricReaderType } from '../../types';
import { MetricType } from '../../types';
import { MetricCard } from './MetricCard';
import { MetricSettingsCard } from './MetricSettingsCard';
import { MetricAttributesEditor } from './MetricAttributesEditor';

export interface MetricsEditorProps {
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
        <MetricSettingsCard
          temporality={temporality}
          aggregation={aggregation}
          readers={readers}
          onUpdateTemporality={onUpdateTemporality}
          onUpdateAggregation={onUpdateAggregation}
          onUpdateReaders={onUpdateReaders}
        />
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
            <MantineText size="sm" c="dimmed" ta="center" py="md">
              No metrics configured. Add a metric to get started.
            </MantineText>
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
        <MetricAttributesEditor
          metricAttributes={metricAttributes}
          onUpdate={onUpdateMetricAttributes}
        />
      </Card>
    </Stack>
  );
}

export default MetricsEditor;