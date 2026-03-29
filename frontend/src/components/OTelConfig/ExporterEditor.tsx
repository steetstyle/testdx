import { useState } from 'react';
import {
  Box, Group, Button, Text, Stack, Card, ActionIcon,
  Modal, Grid, Select, TextInput, NumberInput, Switch
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus, Trash2, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { ExporterConfig, ExporterType, OtelProtocol, CompressionType } from '../../types';

interface ExporterEditorProps {
  exporters: ExporterConfig[];
  onUpdate: (exporters: ExporterConfig[]) => void;
  signalName: 'trace' | 'metric' | 'log';
}

export function ExporterEditor({ exporters, onUpdate, signalName }: ExporterEditorProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [expandedExporters, setExpandedExporters] = useState<Set<number>>(new Set());

  const emptyExporter: ExporterConfig = {
    type: ExporterType.OTLP,
    endpoint: signalName === 'trace' ? 'http://localhost:4318/v1/traces' :
              signalName === 'metric' ? 'http://localhost:4318/v1/metrics' :
              'http://localhost:4318/v1/logs',
    protocol: OtelProtocol.HTTP,
    timeout: 30000,
    compression: CompressionType.GZIP,
    headers: {},
    tlsConfig: {
      insecure: true,
    },
  };

  const [currentExporter, setCurrentExporter] = useState<ExporterConfig>(emptyExporter);

  const handleAdd = () => {
    setCurrentExporter(emptyExporter);
    setEditingIdx(null);
    open();
  };

  const handleEdit = (idx: number) => {
    setCurrentExporter({ ...exporters[idx] });
    setEditingIdx(idx);
    open();
  };

  const handleSave = () => {
    if (editingIdx !== null) {
      const newExporters = [...exporters];
      newExporters[editingIdx] = currentExporter;
      onUpdate(newExporters);
    } else {
      onUpdate([...exporters, currentExporter]);
    }
    close();
  };

  const handleDelete = (idx: number) => {
    onUpdate(exporters.filter((_, i) => i !== idx));
  };

  const toggleExpand = (idx: number) => {
    setExpandedExporters(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <>
      <Box>
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>Exporters</Text>
          <Button size="xs" variant="subtle" leftSection={<Plus size={12} />} onClick={handleAdd}>
            Add Exporter
          </Button>
        </Group>
        {exporters.length === 0 ? (
          <Text size="sm" c="dimmed">No exporters configured</Text>
        ) : (
          <Stack gap="xs">
            {exporters.map((exporter, idx) => (
              <Card key={idx} withBorder padding="xs" style={{ backgroundColor: 'var(--color-bg-muted)' }}>
                <Group justify="space-between" onClick={() => toggleExpand(idx)} style={{ cursor: 'pointer' }}>
                  <Group gap="xs">
                    <ActionIcon variant="subtle" size="sm">
                      {expandedExporters.has(idx) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </ActionIcon>
                    <Text size="sm" fw={500}>{exporter.type}</Text>
                    <Text size="sm" c="dimmed" truncate style={{ maxWidth: 200 }}>
                      {exporter.endpoint}
                    </Text>
                  </Group>
                  <Group gap={4}>
                    <ActionIcon variant="subtle" size="sm" color="blue" onClick={(e) => { e.stopPropagation(); handleEdit(idx); }}>
                      <Download size={12} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" size="sm" color="red" onClick={(e) => { e.stopPropagation(); handleDelete(idx); }}>
                      <Trash2 size={12} />
                    </ActionIcon>
                  </Group>
                </Group>
                <Box style={{ display: expandedExporters.has(idx) ? 'block' : 'none' }}>
                  <Grid mt="xs">
                    <Grid.Col span={6}>
                      <Text size="xs" c="dimmed">Type: {exporter.type}</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="xs" c="dimmed">Protocol: {exporter.protocol}</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="xs" c="dimmed">Timeout: {exporter.timeout}ms</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="xs" c="dimmed">Compression: {exporter.compression}</Text>
                    </Grid.Col>
                  </Grid>
                </Box>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      <Modal opened={opened} onClose={close} title={editingIdx !== null ? 'Edit Exporter' : 'Add Exporter'} size="lg">
        <Grid>
          <Grid.Col span={6}>
            <Select
              label="Exporter Type"
              data={Object.values(ExporterType).map(t => ({ value: t, label: t }))}
              value={currentExporter.type}
              onChange={(val) => setCurrentExporter({ ...currentExporter, type: val as ExporterType })}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select
              label="Protocol"
              data={[
                { value: OtelProtocol.HTTP, label: 'HTTP' },
                { value: OtelProtocol.GRPC, label: 'gRPC' },
              ]}
              value={currentExporter.protocol}
              onChange={(val) => setCurrentExporter({ ...currentExporter, protocol: val as OtelProtocol })}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <TextInput
              label="Endpoint"
              value={currentExporter.endpoint}
              onChange={(e) => setCurrentExporter({ ...currentExporter, endpoint: e.target.value })}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label="Compression"
              data={[
                { value: CompressionType.NONE, label: 'None' },
                { value: CompressionType.GZIP, label: 'GZIP' },
                { value: CompressionType.ZSTD, label: 'ZSTD' },
              ]}
              value={currentExporter.compression}
              onChange={(val) => setCurrentExporter({ ...currentExporter, compression: val as CompressionType })}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label="Timeout (ms)"
              value={currentExporter.timeout}
              onChange={(val) => setCurrentExporter({ ...currentExporter, timeout: Number(val) })}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Switch
              label="TLS Insecure"
              checked={currentExporter.tlsConfig?.insecure ?? true}
              onChange={(e) => setCurrentExporter({
                ...currentExporter,
                tlsConfig: { ...currentExporter.tlsConfig, insecure: e.currentTarget.checked }
              })}
            />
          </Grid.Col>
        </Grid>
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={close}>Cancel</Button>
          <Button onClick={handleSave}>{editingIdx !== null ? 'Update' : 'Add'}</Button>
        </Group>
      </Modal>
    </>
  );
}