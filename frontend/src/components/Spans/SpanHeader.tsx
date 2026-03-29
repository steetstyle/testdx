import { TextInput, Select, NumberInput, Grid } from '@mantine/core';
import { SpanConfig as SpanConfigType, SpanKind, StatusCode } from '../../types';

const kindOptions = Object.values(SpanKind).map(k => ({ value: k, label: k }));
const statusOptions = Object.values(StatusCode).map(s => ({ value: s, label: s }));

interface SpanHeaderProps {
  span: SpanConfigType;
  allSpanNames: string[];
  onUpdate: (updates: Partial<SpanConfigType>) => void;
}

export function SpanHeader({ span, allSpanNames, onUpdate }: SpanHeaderProps) {
  const linkSpanOptions = allSpanNames.filter(n => n !== span.id && n !== span.name);

  return (
    <Grid>
      <Grid.Col span={6}>
        <TextInput
          label="Span Name"
          value={span.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          size="sm"
        />
      </Grid.Col>
      <Grid.Col span={3}>
        <Select
          label="Kind"
          data={kindOptions}
          value={span.kind}
          onChange={(val) => onUpdate({ kind: val as SpanKind })}
          size="sm"
        />
      </Grid.Col>
      <Grid.Col span={3}>
        <Select
          label="Status"
          data={statusOptions}
          value={span.statusCode}
          onChange={(val) => onUpdate({ statusCode: val as StatusCode })}
          size="sm"
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <Select
          label="Parent Span"
          data={[{ value: '', label: 'None (Root)' }, ...linkSpanOptions.map(n => ({ value: n, label: n }))]}
          value={span.parentSpanId || ''}
          onChange={(val) => onUpdate({ parentSpanId: val || undefined })}
          size="sm"
          clearable
        />
      </Grid.Col>
      <Grid.Col span={3}>
        <NumberInput
          label="Duration (ms)"
          value={span.durationMs}
          onChange={(val) => onUpdate({ durationMs: Number(val) })}
          min={1}
          size="sm"
        />
      </Grid.Col>
    </Grid>
  );
}