import { Card, Group, ActionIcon, Text, Badge, Collapse, Divider } from '@mantine/core';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { LogRecord } from '../../types';
import { LogRecordForm } from './LogRecordForm';
import { LogAttributesEditor } from './LogAttributesEditor';

interface LogCardProps {
  log: LogRecord;
  index: number;
  onUpdate: (updates: Partial<LogRecord>) => void;
  onDelete: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

export function LogCard({ log, onUpdate, onDelete, expanded, onToggleExpand }: LogCardProps) {
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
        <LogRecordForm log={log} onUpdate={onUpdate} />

        <Divider my="sm" label="Attributes" labelPosition="left" />

        <LogAttributesEditor 
          attributes={log.attributes || {}} 
          onUpdate={(attributes) => onUpdate({ attributes })} 
        />
      </Collapse>
    </Card>
  );
}