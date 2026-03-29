import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card, Text, Group, Button, Box, Stack, Tabs
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Download } from 'lucide-react';
import type { OtelSdkConfig } from '../types';
import { ConfigExportDialog } from './ConfigExportDialog';
import { useOTelConfig } from './OTelConfig/useOTelConfig';
import { ResourcePanel } from './OTelConfig/ResourcePanel';
import { TracePanel } from './OTelConfig/TracePanel';
import { MetricPanel } from './OTelConfig/MetricPanel';
import { LogPanel } from './OTelConfig/LogPanel';
import { PropagatorsPanel } from './OTelConfig/PropagatorsPanel';

interface OTelConfigFormProps {
  value: OtelSdkConfig;
  onChange: (config: OtelSdkConfig) => void;
  readOnly?: boolean;
}

export function OTelConfigForm({ value, onChange, readOnly = false }: OTelConfigFormProps) {
  const { config, updateConfig, updateNested, setConfig } = useOTelConfig(value);
  const [activeTab, setActiveTab] = useState<string | null>('resource');
  const [exportOpened, { open: openExport, close: closeExport }] = useDisclosure(false);
  const isInternalUpdate = useRef(false);
  const prevConfigRef = useRef<OtelSdkConfig | null>(null);

  useEffect(() => {
    if (value) {
      isInternalUpdate.current = true;
      setConfig(value);
      prevConfigRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (prevConfigRef.current && prevConfigRef.current !== config) {
      prevConfigRef.current = config;
      onChange(config);
    }
  }, [config, onChange]);

  if (readOnly) {
    return (
      <Box>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Service Name</Text>
            <Text size="sm">{config.resource?.serviceName || '-'}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">OTLP Endpoint</Text>
            <Text size="sm" style={{ wordBreak: 'break-all' }}>{config.trace?.endpoint || '-'}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Protocol</Text>
            <Text size="sm">{config.trace?.protocol || '-'}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Span Processor</Text>
            <Text size="sm">{config.trace?.spanProcessor || '-'}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Sampler</Text>
            <Text size="sm">{config.trace?.samplerType || '-'}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Log Level</Text>
            <Text size="sm">{config.logLevel || '-'}</Text>
          </Group>
          <Text size="xs" c="dimmed" mt="md">Edit from Dashboard &gt; Services</Text>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <Group justify="flex-end" mb="md">
        <Button
          variant="secondary"
          size="sm"
          leftSection={<Download size={14} />}
          onClick={openExport}
        >
          Export
        </Button>
      </Group>

      <ConfigExportDialog
        opened={exportOpened}
        onClose={closeExport}
        config={config}
        title="Export SDK Configuration"
      />

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="resource">Resource</Tabs.Tab>
          <Tabs.Tab value="trace">Traces</Tabs.Tab>
          <Tabs.Tab value="metric">Metrics</Tabs.Tab>
          <Tabs.Tab value="log">Logs</Tabs.Tab>
          <Tabs.Tab value="propagators">Propagators</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="resource" pt="md">
          <ResourcePanel config={config} updateConfig={updateConfig} />
        </Tabs.Panel>

        <Tabs.Panel value="trace" pt="md">
          <TracePanel config={config} updateNested={updateNested} />
        </Tabs.Panel>

        <Tabs.Panel value="metric" pt="md">
          <MetricPanel config={config} updateNested={updateNested} />
        </Tabs.Panel>

        <Tabs.Panel value="log" pt="md">
          <LogPanel config={config} updateNested={updateNested} />
        </Tabs.Panel>

        <Tabs.Panel value="propagators" pt="md">
          <PropagatorsPanel config={config} updateConfig={updateConfig} />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}

export default OTelConfigForm;