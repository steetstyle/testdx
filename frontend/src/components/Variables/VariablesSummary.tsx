import { Group, Badge, Tooltip } from '@mantine/core';
import { formatVariableValue } from './VariableEntryRow';

interface VariablesSummaryProps {
  variables: Record<string, unknown>;
  maxShow?: number;
}

export function VariablesSummary({ variables, maxShow = 3 }: VariablesSummaryProps) {
  if (!variables || typeof variables !== 'object') return null;
  
  const entries = Object.entries(variables);
  if (entries.length === 0) return null;

  const visible = entries.slice(0, maxShow);
  const remaining = entries.length - maxShow;

  return (
    <Group gap={4}>
      {visible.map(([key, value], idx) => (
        <Tooltip key={idx} label={`${key} = ${formatVariableValue(value)}`}>
          <Badge 
            size="sm" 
            variant="light" 
            color="gray"
            style={{ fontFamily: 'monospace', fontSize: 10 }}
          >
            {key}
          </Badge>
        </Tooltip>
      ))}
      {remaining > 0 && (
        <Badge size="sm" variant="light" color="gray">
          +{remaining}
        </Badge>
      )}
    </Group>
  );
}