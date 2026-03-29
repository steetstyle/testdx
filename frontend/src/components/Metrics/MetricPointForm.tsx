import { Grid, TextInput, Select, NumberInput } from '@mantine/core';
import type { MetricPoint } from '../../types';
import { MetricType } from '../../types';

const metricTypeOptions = Object.values(MetricType).map(t => ({ value: t, label: t }));

interface MetricPointFormProps {
  metric: MetricPoint;
  onUpdate: (updates: Partial<MetricPoint>) => void;
}

export function MetricPointForm({ metric, onUpdate }: MetricPointFormProps) {
  return (
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
  );
}