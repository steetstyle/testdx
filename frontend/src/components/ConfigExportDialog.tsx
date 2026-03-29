import { useState } from 'react';
import {
  Modal, Tabs, Stack, Group, Button, Text, Divider
} from '@mantine/core';
import type { OtelSdkConfig } from '../types';
import { useExportDialog } from './ConfigExportDialog/useExportDialog';
import { YamlPanel } from './ConfigExportDialog/YamlPanel';
import { EnvPanel } from './ConfigExportDialog/EnvPanel';
import { CodePanel } from './ConfigExportDialog/CodePanel';
import type { CodeLanguage } from '../services/configGenerator';

interface ConfigExportDialogProps {
  opened: boolean;
  onClose: () => void;
  config: OtelSdkConfig;
  title?: string;
  mode?: 'sdk' | 'scenario';
  scenarioName?: string;
  telemetryType?: string;
  traceConfig?: unknown;
  metricConfig?: unknown;
  logConfig?: unknown;
}

export function ConfigExportDialog({
  opened,
  onClose,
  config,
  title = 'Export Configuration',
  mode = 'sdk',
  scenarioName,
  telemetryType,
  traceConfig,
  metricConfig,
  logConfig,
}: ConfigExportDialogProps) {
  const [activeTab, setActiveTab] = useState<string | null>('yaml');
  const { yamlContent, envContent, codeContent, handleDownload, language, setLanguage } =
    useExportDialog(config, mode, scenarioName, telemetryType, traceConfig, metricConfig, logConfig);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="xl"
      centered
    >
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="yaml">YAML</Tabs.Tab>
          <Tabs.Tab value="env">Environment Variables</Tabs.Tab>
          <Tabs.Tab value="code">Code Snippet</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="yaml" pt="md">
          <Stack gap="sm">
            <Text size="sm" c="dimmed">
              OpenTelemetry Collector configuration format
            </Text>
            <YamlPanel content={yamlContent} onDownload={handleDownload} />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="env" pt="md">
          <Stack gap="sm">
            <Text size="sm" c="dimmed">
              Environment variables for SDK configuration
            </Text>
            <EnvPanel content={envContent} onDownload={handleDownload} />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="code" pt="md">
          <CodePanel
            content={codeContent}
            language={language}
            onLanguageChange={setLanguage}
            onDownload={handleDownload}
          />
        </Tabs.Panel>
      </Tabs>

      <Divider my="md" />

      <Group justify="flex-end">
        <Button variant="subtle" onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
}

export default ConfigExportDialog;