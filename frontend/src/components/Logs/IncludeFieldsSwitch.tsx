import { Grid, Switch } from '@mantine/core';

interface IncludeFieldsSwitchProps {
  includeTraceId: boolean;
  includeSpanId: boolean;
  includeResourceAttributes: boolean;
  includeLogLevel: boolean;
  includeSystemAttributes: boolean;
  onUpdateIncludeTraceId: (v: boolean) => void;
  onUpdateIncludeSpanId: (v: boolean) => void;
  onUpdateIncludeResourceAttributes: (v: boolean) => void;
  onUpdateIncludeLogLevel: (v: boolean) => void;
  onUpdateIncludeSystemAttributes: (v: boolean) => void;
}

export function IncludeFieldsSwitch({
  includeTraceId,
  includeSpanId,
  includeResourceAttributes,
  includeLogLevel,
  includeSystemAttributes,
  onUpdateIncludeTraceId,
  onUpdateIncludeSpanId,
  onUpdateIncludeResourceAttributes,
  onUpdateIncludeLogLevel,
  onUpdateIncludeSystemAttributes,
}: IncludeFieldsSwitchProps) {
  return (
    <Grid>
      <Grid.Col span={4}>
        <Switch
          label="Include Trace ID"
          checked={includeTraceId}
          onChange={(e) => onUpdateIncludeTraceId(e.currentTarget.checked)}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <Switch
          label="Include Span ID"
          checked={includeSpanId}
          onChange={(e) => onUpdateIncludeSpanId(e.currentTarget.checked)}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <Switch
          label="Include Resource Attributes"
          checked={includeResourceAttributes}
          onChange={(e) => onUpdateIncludeResourceAttributes(e.currentTarget.checked)}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <Switch
          label="Include Log Level"
          checked={includeLogLevel}
          onChange={(e) => onUpdateIncludeLogLevel(e.currentTarget.checked)}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <Switch
          label="Include System Attributes"
          checked={includeSystemAttributes}
          onChange={(e) => onUpdateIncludeSystemAttributes(e.currentTarget.checked)}
        />
      </Grid.Col>
    </Grid>
  );
}