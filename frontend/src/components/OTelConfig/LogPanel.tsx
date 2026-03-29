import {
  Stack, Switch, Grid, TextInput, Select, NumberInput,
  Divider
} from '@mantine/core';
import { OtelProtocol } from '../../types';
import { ExporterEditor } from './ExporterEditor';
import type { OtelSdkConfig } from '../../types';

interface LogPanelProps {
  config: OtelSdkConfig;
  updateNested: (section: string, field: string, val: unknown) => void;
}

export function LogPanel({ config, updateNested }: LogPanelProps) {
  return (
    <Stack>
      <Switch
        label="Enabled"
        checked={config.log?.enabled ?? true}
        onChange={(e) => updateNested('log', 'enabled', e.currentTarget.checked)}
      />
      <Divider label="Basic Settings" />
      <Grid>
        <Grid.Col span={6}>
          <TextInput
            label="Service Name"
            value={config.log?.serviceName || ''}
            onChange={(e) => updateNested('log', 'serviceName', e.target.value)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Instrumentation Scope"
            value={config.log?.instrumentationScopeName || ''}
            onChange={(e) => updateNested('log', 'instrumentationScopeName', e.target.value)}
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
            value={config.log?.protocol || OtelProtocol.HTTP}
            onChange={(val) => updateNested('log', 'protocol', val)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Endpoint"
            value={config.log?.endpoint || ''}
            onChange={(e) => updateNested('log', 'endpoint', e.target.value)}
          />
        </Grid.Col>
      </Grid>
      <Divider label="Include Fields" />
      <Grid>
        <Grid.Col span={6}>
          <Switch
            label="Include Trace ID"
            checked={config.log?.includeTraceId ?? true}
            onChange={(e) => updateNested('log', 'includeTraceId', e.currentTarget.checked)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Switch
            label="Include Span ID"
            checked={config.log?.includeSpanId ?? true}
            onChange={(e) => updateNested('log', 'includeSpanId', e.currentTarget.checked)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Switch
            label="Include Resource Attributes"
            checked={config.log?.includeResourceAttributes ?? true}
            onChange={(e) => updateNested('log', 'includeResourceAttributes', e.currentTarget.checked)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Switch
            label="Include Log Level"
            checked={config.log?.includeLogLevel ?? true}
            onChange={(e) => updateNested('log', 'includeLogLevel', e.currentTarget.checked)}
          />
        </Grid.Col>
      </Grid>
      <Divider label="Limits" />
      <Grid>
        <Grid.Col span={4}>
          <NumberInput
            label="Max Attributes"
            value={config.log?.maxNumberOfAttributes || 100}
            onChange={(val) => updateNested('log', 'maxNumberOfAttributes', Number(val))}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <NumberInput
            label="Max Attributes Per Log Record"
            value={config.log?.maxNumberOfAttributesPerLogRecord || 32}
            onChange={(val) => updateNested('log', 'maxNumberOfAttributesPerLogRecord', Number(val))}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <NumberInput
            label="Max Log Records"
            value={config.log?.maxNumberOfLogRecords || 1000}
            onChange={(val) => updateNested('log', 'maxNumberOfLogRecords', Number(val))}
          />
        </Grid.Col>
      </Grid>
      <Divider label="Exporters" />
      <ExporterEditor
        exporters={config.log?.exporters || []}
        onUpdate={(exporters) => updateNested('log', 'exporters', exporters)}
        signalName="log"
      />
    </Stack>
  );
}