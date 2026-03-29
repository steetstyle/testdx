import {
  Stack, Switch, Grid, TextInput, Select, NumberInput,
  Divider
} from '@mantine/core';
import {
  OtelProtocol, CompressionType, SamplerType, SpanProcessorType
} from '../../types';
import { ExporterEditor } from './ExporterEditor';
import type { OtelSdkConfig } from '../../types';

interface TracePanelProps {
  config: OtelSdkConfig;
  updateNested: (section: string, field: string, val: unknown) => void;
}

export function TracePanel({ config, updateNested }: TracePanelProps) {
  return (
    <Stack>
      <Switch
        label="Enabled"
        checked={config.trace?.enabled ?? true}
        onChange={(e) => updateNested('trace', 'enabled', e.currentTarget.checked)}
      />
      <Divider label="Basic Settings" />
      <Grid>
        <Grid.Col span={6}>
          <TextInput
            label="Service Name"
            value={config.trace?.serviceName || ''}
            onChange={(e) => updateNested('trace', 'serviceName', e.target.value)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Instrumentation Scope"
            value={config.trace?.instrumentationScopeName || ''}
            onChange={(e) => updateNested('trace', 'instrumentationScopeName', e.target.value)}
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
            value={config.trace?.protocol || OtelProtocol.HTTP}
            onChange={(val) => updateNested('trace', 'protocol', val)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Endpoint"
            value={config.trace?.endpoint || ''}
            onChange={(e) => updateNested('trace', 'endpoint', e.target.value)}
          />
        </Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={6}>
          <Select
            label="Compression"
            data={[
              { value: CompressionType.NONE, label: 'None' },
              { value: CompressionType.GZIP, label: 'GZIP' },
              { value: CompressionType.ZSTD, label: 'ZSTD' },
            ]}
            value={config.trace?.compression || CompressionType.GZIP}
            onChange={(val) => updateNested('trace', 'compression', val)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <NumberInput
            label="Timeout (ms)"
            value={config.trace?.timeout || 30000}
            onChange={(val) => updateNested('trace', 'timeout', Number(val))}
          />
        </Grid.Col>
      </Grid>
      <Divider label="Sampling" />
      <Grid>
        <Grid.Col span={6}>
          <Select
            label="Sampler Type"
            data={[
              { value: SamplerType.ALWAYS_ON, label: 'Always On' },
              { value: SamplerType.ALWAYS_OFF, label: 'Always Off' },
              { value: SamplerType.PARENT_BASED_ALWAYS_ON, label: 'Parent Based Always On' },
              { value: SamplerType.PARENT_BASED_ALWAYS_OFF, label: 'Parent Based Always Off' },
              { value: SamplerType.PARENT_BASED_TRACE_ID, label: 'Parent Based TraceID Ratio' },
              { value: SamplerType.TRACE_ID_RATIO, label: 'TraceID Ratio' },
            ]}
            value={config.trace?.samplerType || SamplerType.PARENT_BASED_TRACE_ID}
            onChange={(val) => updateNested('trace', 'samplerType', val)}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <NumberInput
            label="Sampler Param"
            value={config.trace?.samplerParam || 1.0}
            min={0}
            max={1}
            step={0.1}
            onChange={(val) => updateNested('trace', 'samplerParam', Number(val))}
          />
        </Grid.Col>
      </Grid>
      <Divider label="Span Processing" />
      <Grid>
        <Grid.Col span={6}>
          <Select
            label="Span Processor"
            data={[
              { value: SpanProcessorType.BATCH, label: 'Batch' },
              { value: SpanProcessorType.SIMPLE, label: 'Simple' },
            ]}
            value={config.trace?.spanProcessor || SpanProcessorType.BATCH}
            onChange={(val) => updateNested('trace', 'spanProcessor', val)}
          />
        </Grid.Col>
      </Grid>
      {config.trace?.spanProcessor === SpanProcessorType.BATCH && (
        <Grid>
          <Grid.Col span={3}>
            <NumberInput
              label="Max Queue Size"
              value={config.trace?.batchConfig?.maxQueueSize || 2048}
              onChange={(val) => updateNested('trace', 'batchConfig', { ...config.trace?.batchConfig, maxQueueSize: Number(val) })}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput
              label="Max Export Batch"
              value={config.trace?.batchConfig?.maxExportBatchSize || 512}
              onChange={(val) => updateNested('trace', 'batchConfig', { ...config.trace?.batchConfig, maxExportBatchSize: Number(val) })}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput
              label="Scheduled Delay (ms)"
              value={config.trace?.batchConfig?.scheduledDelay || 5000}
              onChange={(val) => updateNested('trace', 'batchConfig', { ...config.trace?.batchConfig, scheduledDelay: Number(val) })}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput
              label="Export Timeout (ms)"
              value={config.trace?.batchConfig?.exportTimeout || 30000}
              onChange={(val) => updateNested('trace', 'batchConfig', { ...config.trace?.batchConfig, exportTimeout: Number(val) })}
            />
          </Grid.Col>
        </Grid>
      )}
      <Divider label="Span Limits" />
      <Grid>
        <Grid.Col span={4}>
          <NumberInput
            label="Max Attributes"
            value={config.trace?.spanLimits?.maxNumberOfAttributes || 1000}
            onChange={(val) => {
              const limits = { ...config.trace?.spanLimits, maxNumberOfAttributes: Number(val) };
              updateNested('trace', 'spanLimits', limits);
            }}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <NumberInput
            label="Max Attributes Per Span"
            value={config.trace?.spanLimits?.maxNumberOfAttributesPerSpan || 128}
            onChange={(val) => {
              const limits = { ...config.trace?.spanLimits, maxNumberOfAttributesPerSpan: Number(val) };
              updateNested('trace', 'spanLimits', limits);
            }}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <NumberInput
            label="Max Attribute Value Length"
            value={config.trace?.spanLimits?.maxAttributeValueLength || 4096}
            onChange={(val) => {
              const limits = { ...config.trace?.spanLimits, maxAttributeValueLength: Number(val) };
              updateNested('trace', 'spanLimits', limits);
            }}
          />
        </Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={4}>
          <NumberInput
            label="Max Events"
            value={config.trace?.spanLimits?.maxNumberOfEvents || 100}
            onChange={(val) => {
              const limits = { ...config.trace?.spanLimits, maxNumberOfEvents: Number(val) };
              updateNested('trace', 'spanLimits', limits);
            }}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <NumberInput
            label="Max Links"
            value={config.trace?.spanLimits?.maxNumberOfLinks || 100}
            onChange={(val) => {
              const limits = { ...config.trace?.spanLimits, maxNumberOfLinks: Number(val) };
              updateNested('trace', 'spanLimits', limits);
            }}
          />
        </Grid.Col>
      </Grid>
      <Divider label="Exporters" />
      <ExporterEditor
        exporters={config.trace?.exporters || []}
        onUpdate={(exporters) => updateNested('trace', 'exporters', exporters)}
        signalName="trace"
      />
    </Stack>
  );
}