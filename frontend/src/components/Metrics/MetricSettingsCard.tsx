import { Grid, Select, MultiSelect } from '@mantine/core';
import { MetricTemporality, AggregationType, MetricReaderType } from '../../types';

const temporalityOptions = Object.values(MetricTemporality).map(t => ({ value: t, label: t }));
const aggregationOptions = Object.values(AggregationType).map(a => ({ value: a, label: a }));
const readerOptions = Object.values(MetricReaderType).map(r => ({ value: r, label: r }));

interface MetricSettingsCardProps {
  temporality: MetricTemporality;
  aggregation: AggregationType;
  readers: MetricReaderType[];
  onUpdateTemporality: (t: MetricTemporality) => void;
  onUpdateAggregation: (a: AggregationType) => void;
  onUpdateReaders: (readers: MetricReaderType[]) => void;
}

export function MetricSettingsCard({
  temporality,
  aggregation,
  readers,
  onUpdateTemporality,
  onUpdateAggregation,
  onUpdateReaders,
}: MetricSettingsCardProps) {
  return (
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
  );
}