import { Stack, Group, Text, Badge, Box } from '@mantine/core';
import { VariableEntryRow } from './VariableEntryRow';

interface VariableEntry {
  key: string;
  value: unknown;
}

interface VariablesTableProps {
  variables: VariableEntry[];
  onDelete?: (key: string) => void;
  readOnly?: boolean;
  title?: string;
  badgeColor?: string;
}

export function VariablesTable({ 
  variables, 
  onDelete, 
  readOnly = false,
  title,
  badgeColor = 'blue'
}: VariablesTableProps) {
  if (!variables || variables.length === 0) {
    return (
      <Box p="sm" style={{ backgroundColor: 'var(--color-bg-muted)', borderRadius: 8 }}>
        <Text size="sm" c="dimmed" ta="center">No variables defined</Text>
      </Box>
    );
  }

  return (
    <Stack gap={4}>
      {title && (
        <Group gap="xs" mt="xs">
          <Text size="sm" fw={500}>{title}</Text>
          <Badge size="sm" variant="light" color={badgeColor}>{variables.length}</Badge>
        </Group>
      )}
      {variables.map((v, idx) => (
        <Group key={idx} gap="xs" wrap="nowrap" py={4}>
          <VariableEntryRow 
            variableKey={v.key} 
            value={v.value} 
            onDelete={onDelete}
            readOnly={readOnly}
          />
        </Group>
      ))}
    </Stack>
  );
}