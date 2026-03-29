import { Card, Group, ActionIcon, Text, Badge, Collapse, Divider } from '@mantine/core';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { MetricPoint } from '../../types';
import { MetricPointForm } from './MetricPointForm';
import { MetricLabelsEditor } from './MetricLabelsEditor';
import { HistogramBucketsInput } from './HistogramBucketsInput';

interface MetricCardProps {
  metric: MetricPoint;
  onUpdate: (updates: Partial<MetricPoint>) => void;
  onDelete: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

export function MetricCard({ metric, onUpdate, onDelete, expanded, onToggleExpand }: MetricCardProps) {
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
        <MetricPointForm metric={metric} onUpdate={onUpdate} />

        <Divider my="sm" label="Labels" labelPosition="left" />

        <MetricLabelsEditor 
          labels={metric.labels || {}} 
          onUpdate={(labels) => onUpdate({ labels })} 
        />

        <HistogramBucketsInput metric={metric} onUpdate={onUpdate} />
      </Collapse>
    </Card>
  );
}