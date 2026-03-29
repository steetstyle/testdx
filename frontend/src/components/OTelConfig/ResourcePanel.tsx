import { Stack, TextInput, Divider, Text } from '@mantine/core';
import type { OtelSdkConfig } from '../../types';

interface ResourcePanelProps {
  config: OtelSdkConfig;
  updateConfig: (path: string, val: unknown) => void;
}

export function ResourcePanel({ config, updateConfig }: ResourcePanelProps) {
  return (
    <Stack>
      <TextInput
        label="Service Name"
        value={config.resource?.serviceName || ''}
        onChange={(e) => updateConfig('resource.serviceName', e.target.value)}
      />
      <TextInput
        label="Service Namespace"
        value={config.resource?.serviceNamespace || ''}
        onChange={(e) => updateConfig('resource.serviceNamespace', e.target.value)}
      />
      <TextInput
        label="Service Instance ID"
        value={config.resource?.serviceInstanceId || ''}
        onChange={(e) => updateConfig('resource.serviceInstanceId', e.target.value)}
      />
      <TextInput
        label="Service Version"
        value={config.resource?.serviceVersion || ''}
        onChange={(e) => updateConfig('resource.serviceVersion', e.target.value)}
      />
      <TextInput
        label="Deployment Environment"
        value={config.resource?.deploymentEnvironment || ''}
        onChange={(e) => updateConfig('resource.deploymentEnvironment', e.target.value)}
      />
      <Divider label="Attributes" labelPosition="left" />
      <Text size="xs" c="dimmed">Resource attributes can be configured in each signal tab</Text>
    </Stack>
  );
}