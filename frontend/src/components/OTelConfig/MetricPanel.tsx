import {
  Stack, Switch, Grid, TextInput, Select,
  Divider
} from '@mantine/core';
import {
  OtelProtocol, MetricTemporality, AggregationType, MetricReaderType
} from '../../types';
import { ExporterEditor } from './ExporterEditor';
import { ViewEditor } from './ViewEditor';
import type { OtelSdkConfig } from '../../types';

interface MetricPanelProps {
  config: OtelSdkConfig;
  updateNested: (section: string, field: string, val: unknown) => void;
}

export function MetricPanel({ config, updateNested }: MetricPanelProps) {
  return (
    <Stack>
      <Switch
        label="Enabled"
        checked={config.metric?.enabled ?? true}
        onChange={(e) => updateNested('metric', 'enabled', e.currentTarget.checked)}
      />
      <Divider label="Basic Settings" />
      <Grid>
        <Grid.Col span={6}>
          <TextInput
            label="Service Name"
            value={config.metric?.serviceName || ''}
            onChange={(e) => updateNested('metric', 'serviceName', e.target.value)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Instrumentation Scope"
            value={config.metric?.instrumentationScopeName || ''}
            onChange={(e) => updateNested('metric', 'instrumentationScopeName', e.target.value)}
          />
        </Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={6}>
          <Select
            label="Protocol"
            data={[
              { value: OtelProtocol.HTTP, label: 'HTTP' },
              { value: OtelProtocol.GRPC, label: 'gRPC' },
              { value: OtelProtocol.HTTP_JSON, label: 'HTTP/JSON' },
            ]}
            value={config.metric?.protocol || OtelProtocol.HTTP}
            onChange={(val) => updateNested('metric', 'protocol', val)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Endpoint"
            value={config.metric?.endpoint || ''}
            onChange={(e) => updateNested('metric', 'endpoint', e.target.value)}
          />
        </Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={6}>
          <Select
            label="Temporality"
            data={[
              { value: MetricTemporality.CUMULATIVE, label: 'Cumulative' },
              { value: MetricTemporality.DELTA, label: 'Delta' },
            ]}
            value={config.metric?.temporality || MetricTemporality.CUMULATIVE}
            onChange={(val) => updateNested('metric', 'temporality', val)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Select
            label="Aggregation"
            data={[
              { value: AggregationType.HISTOGRAM, label: 'Histogram' },
              { value: AggregationType.LAST_VALUE, label: 'Last Value' },
              { value: AggregationType.SUM, label: 'Sum' },
              { value: AggregationType.DROP, label: 'Drop' },
              { value: AggregationType.EXPONENTIAL_HISTOGRAM, label: 'Exponential Histogram' },
            ]}
            value={config.metric?.aggregation || AggregationType.HISTOGRAM}
            onChange={(val) => updateNested('metric', 'aggregation', val)}
          />
        </Grid.Col>
      </Grid>
      <Divider label="Readers" />
      <Grid>
        <Grid.Col span={6}>
          <Select
            label="Metric Reader"
            data={[
              { value: MetricReaderType.PERIODIC, label: 'Periodic' },
              { value: MetricReaderType.PULL, label: 'Pull' },
            ]}
            value={config.metric?.readers?.[0] || MetricReaderType.PERIODIC}
            onChange={(val) => updateNested('metric', 'readers', [val])}
          />
        </Grid.Col>
      </Grid>
      <Divider label="Views" />
      <ViewEditor
        views={config.metric?.views || []}
        onUpdate={(views) => updateNested('metric', 'views', views)}
      />
      <Divider label="Exporters" />
      <ExporterEditor
        exporters={config.metric?.exporters || []}
        onUpdate={(exporters) => updateNested('metric', 'exporters', exporters)}
        signalName="metric"
      />
    </Stack>
  );
}