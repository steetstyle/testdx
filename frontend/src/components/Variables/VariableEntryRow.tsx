import { Text, Code, ActionIcon } from '@mantine/core';
import { Trash2 } from 'lucide-react';

interface VariableEntryRowProps {
  variableKey: string;
  value: unknown;
  onDelete?: (key: string) => void;
  readOnly?: boolean;
}

function formatVariableValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(v => typeof v === 'string' ? `"${v}"` : String(v)).join(', ')}]`;
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function VariableEntryRow({ variableKey, value, onDelete, readOnly }: VariableEntryRowProps) {
  return (
    <>
      <Code 
        style={{ 
          flex: '0 0 120px', 
          fontFamily: 'monospace', 
          fontSize: 12, 
          backgroundColor: 'var(--color-bg-muted)', 
          padding: '2px 6px' 
        }}
      >
        {variableKey}
      </Code>
      <Text size="xs" c="dimmed">=</Text>
      <Code style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
        {formatVariableValue(value)}
      </Code>
      {!readOnly && onDelete && (
        <ActionIcon 
          size="sm" 
          variant="subtle" 
          color="red" 
          onClick={() => onDelete(variableKey)}
        >
          <Trash2 size={12} />
        </ActionIcon>
      )}
    </>
  );
}

export { formatVariableValue };