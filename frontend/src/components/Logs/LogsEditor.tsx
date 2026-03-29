import { Stack, Card, Text, Group, Button } from '@mantine/core';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { LogRecord } from '../../types';
import { LogCard } from './LogCard';
import { IncludeFieldsSwitch } from './IncludeFieldsSwitch';
import { LogResourceAttributesEditor } from './LogResourceAttributesEditor';

export interface LogsEditorProps {
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
        <IncludeFieldsSwitch
          includeTraceId={includeTraceId}
          includeSpanId={includeSpanId}
          includeResourceAttributes={includeResourceAttributes}
          includeLogLevel={includeLogLevel}
          includeSystemAttributes={includeSystemAttributes}
          onUpdateIncludeTraceId={onUpdateIncludeTraceId}
          onUpdateIncludeSpanId={onUpdateIncludeSpanId}
          onUpdateIncludeResourceAttributes={onUpdateIncludeResourceAttributes}
          onUpdateIncludeLogLevel={onUpdateIncludeLogLevel}
          onUpdateIncludeSystemAttributes={onUpdateIncludeSystemAttributes}
        />
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
        <LogResourceAttributesEditor
          logAttributes={logAttributes}
          onUpdate={onUpdateLogAttributes}
        />
      </Card>
    </Stack>
  );
}

export default LogsEditor;