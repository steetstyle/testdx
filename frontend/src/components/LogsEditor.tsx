import {
  Stack, Grid, TextInput, Select,
  Switch, Divider, Text, Group, ActionIcon, Button,
  Card, Badge, Collapse
} from '@mantine/core';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { LogRecord } from '../types';

interface LogsEditorProps {
  logs: LogRecord[];
  logAttributes: Record<string, string>;
  includeTraceId: boolean;
  includeSpanId: boolean;
  includeResourceAttributes: boolean;
  includeLogLevel: boolean;
  includeSystemAttributes: boolean;
  onUpdateLogs: (logs: LogRecord[]) => void;
  onUpdateLogAttributes: (attrs: Record<string, string>) => void;
  onUpdateIncludeTraceId: (v: boolean) => void;
  onUpdateIncludeSpanId: (v: boolean) => void;
  onUpdateIncludeResourceAttributes: (v: boolean) => void;
  onUpdateIncludeLogLevel: (v: boolean) => void;
  onUpdateIncludeSystemAttributes: (v: boolean) => void;
}

const severityOptions = [
  { value: 'Trace', label: 'Trace' },
  { value: 'Debug', label: 'Debug' },
  { value: 'Info', label: 'Info' },
  { value: 'Warn', label: 'Warn' },
  { value: 'Error', label: 'Error' },
  { value: 'Fatal', label: 'Fatal' },
];

const severityNumberMap: Record<string, number> = {
  Trace: 1,
  Debug: 5,
  Info: 9,
  Warn: 13,
  Error: 17,
  Fatal: 21,
};

interface LogCardProps {
  log: LogRecord;
  index: number;
  onUpdate: (updates: Partial<LogRecord>) => void;
  onDelete: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

function LogCard({ log, onUpdate, onDelete, expanded, onToggleExpand }: LogCardProps) {
  return (
    <Card withBorder padding="sm" style={{ backgroundColor: 'var(--color-bg-muted)' }}>
      <Group justify="space-between" onClick={onToggleExpand} style={{ cursor: 'pointer' }}>
        <Group gap="xs">
          <ActionIcon variant="subtle" size="sm">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </ActionIcon>
          <Badge
            size="xs"
            variant="light"
            color={
              log.severityText === 'Error' || log.severityText === 'Fatal' ? 'red' :
              log.severityText === 'Warn' ? 'yellow' :
              log.severityText === 'Info' ? 'blue' : 'gray'
            }
          >
            {log.severityText}
          </Badge>
          <Text size="sm" c="dimmed" truncate style={{ maxWidth: 200 }}>
            {log.body || 'No body'}
          </Text>
        </Group>
        <ActionIcon
          variant="subtle"
          color="red"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={12} />
        </ActionIcon>
      </Group>

      <Collapse in={expanded}>
        <Grid mt="sm">
          <Grid.Col span={8}>
            <TextInput
              label="Body"
              value={log.body}
              onChange={(e) => onUpdate({ body: e.target.value })}
              size="sm"
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label="Severity"
              data={severityOptions}
              value={log.severityText}
              onChange={(val) => {
                const severity = val || 'Info';
                const num = severityNumberMap[severity];
                onUpdate({ severityText: severity, severityNumber: num });
              }}
              size="sm"
            />
          </Grid.Col>
        </Grid>

        <Divider my="sm" label="Attributes" labelPosition="left" />

        <Stack gap="xs">
          {Object.entries(log.attributes || {}).map(([key, value]) => (
            <Group key={key} gap="xs">
              <TextInput
                placeholder="Key"
                value={key}
                onChange={(e) => {
                  const newAttrs = { ...log.attributes };
                  delete newAttrs[key];
                  newAttrs[e.target.value] = value;
                  onUpdate({ attributes: newAttrs });
                }}
                size="xs"
                style={{ flex: 1 }}
              />
              <TextInput
                placeholder="Value"
                value={String(value)}
                onChange={(e) => {
                  onUpdate({ attributes: { ...log.attributes, [key]: e.target.value } });
                }}
                size="xs"
                style={{ flex: 1 }}
              />
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => {
                  const newAttrs = { ...log.attributes };
                  delete newAttrs[key];
                  onUpdate({ attributes: newAttrs });
                }}
              >
                <Trash2 size={12} />
              </ActionIcon>
            </Group>
          ))}
          <Button
            variant="subtle"
            size="xs"
            leftSection={<Plus size={12} />}
            onClick={() => {
              onUpdate({ attributes: { ...log.attributes, ['']: '' } });
            }}
          >
            Add Attribute
          </Button>
        </Stack>
      </Collapse>
    </Card>
  );
}

export function LogsEditor({
  logs,
  logAttributes,
  includeTraceId,
  includeSpanId,
  includeResourceAttributes,
  includeLogLevel,
  includeSystemAttributes,
  onUpdateLogs,
  onUpdateLogAttributes,
  onUpdateIncludeTraceId,
  onUpdateIncludeSpanId,
  onUpdateIncludeResourceAttributes,
  onUpdateIncludeLogLevel,
  onUpdateIncludeSystemAttributes,
}: LogsEditorProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set([0]));

  const handleAddLog = () => {
    const newLog: LogRecord = {
      severityNumber: 9,
      severityText: 'Info',
      body: 'Log message',
      attributes: {},
    };
    onUpdateLogs([...logs, newLog]);
    setExpandedLogs(prev => new Set([...prev, logs.length]));
  };

  const handleUpdateLog = (idx: number, updates: Partial<LogRecord>) => {
    const newLogs = [...logs];
    newLogs[idx] = { ...newLogs[idx], ...updates };
    onUpdateLogs(newLogs);
  };

  const handleDeleteLog = (idx: number) => {
    const newLogs = logs.filter((_, i) => i !== idx);
    onUpdateLogs(newLogs);
    const newExpanded = new Set(expandedLogs);
    newExpanded.delete(idx);
    setExpandedLogs(newExpanded);
  };

  const toggleExpand = (idx: number) => {
    setExpandedLogs(prev => {
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
    <Stack gap="md">
      <Card withBorder padding="md">
        <Text fw={500} mb="md">Include Fields</Text>
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
      </Card>

      <Card withBorder padding="md">
        <Group justify="space-between" mb="md">
          <Text fw={500}>Log Records</Text>
          <Button
            size="xs"
            variant="light"
            leftSection={<Plus size={12} />}
            onClick={handleAddLog}
          >
            Add Log
          </Button>
        </Group>

        <Stack gap="sm">
          {logs.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">
              No logs configured. Add a log record to get started.
            </Text>
          ) : (
            logs.map((log, idx) => (
              <LogCard
                key={idx}
                log={log}
                index={idx}
                onUpdate={(updates) => handleUpdateLog(idx, updates)}
                onDelete={() => handleDeleteLog(idx)}
                expanded={expandedLogs.has(idx)}
                onToggleExpand={() => toggleExpand(idx)}
              />
            ))
          )}
        </Stack>
      </Card>

      <Card withBorder padding="md">
        <Text fw={500} mb="md">Log Attributes (Resource)</Text>
        <Stack gap="xs">
          {Object.entries(logAttributes).map(([key, value]) => (
            <Group key={key} gap="xs">
              <TextInput
                placeholder="Key"
                value={key}
                onChange={(e) => {
                  const newAttrs = { ...logAttributes };
                  delete newAttrs[key];
                  newAttrs[e.target.value] = value;
                  onUpdateLogAttributes(newAttrs);
                }}
                size="sm"
                style={{ flex: 1 }}
              />
              <TextInput
                placeholder="Value"
                value={value}
                onChange={(e) => {
                  onUpdateLogAttributes({ ...logAttributes, [key]: e.target.value });
                }}
                size="sm"
                style={{ flex: 1 }}
              />
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => {
                  const newAttrs = { ...logAttributes };
                  delete newAttrs[key];
                  onUpdateLogAttributes(newAttrs);
                }}
              >
                <Trash2 size={12} />
              </ActionIcon>
            </Group>
          ))}
          <Button
            variant="subtle"
            size="xs"
            leftSection={<Plus size={12} />}
            onClick={() => onUpdateLogAttributes({ ...logAttributes, ['']: '' })}
          >
            Add Attribute
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}

export default LogsEditor;
