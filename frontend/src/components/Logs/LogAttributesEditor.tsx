import { Stack, Group, TextInput, ActionIcon, Button, Divider } from '@mantine/core';
import { Plus, Trash2 } from 'lucide-react';
import type { LogRecord } from '../../types';

interface LogAttributesEditorProps {
  attributes: Record<string, string | number | boolean>;
  onUpdate: (attributes: Record<string, string | number | boolean>) => void;
}

export function LogAttributesEditor({ attributes, onUpdate }: LogAttributesEditorProps) {
  const handleAddAttribute = () => {
    onUpdate({ ...attributes, '': '' });
  };

  const handleDeleteAttribute = (key: string) => {
    const newAttrs = { ...attributes };
    delete newAttrs[key];
    onUpdate(newAttrs);
  };

  const handleUpdateKey = (oldKey: string, newKey: string) => {
    const newAttrs = { ...attributes };
    const value = newAttrs[oldKey];
    delete newAttrs[oldKey];
    newAttrs[newKey] = value;
    onUpdate(newAttrs);
  };

  const handleUpdateValue = (key: string, value: string | number | boolean) => {
    onUpdate({ ...attributes, [key]: value });
  };

  return (
    <Stack gap="xs">
      {Object.entries(attributes).map(([key, value]) => (
        <Group key={key} gap="xs">
          <TextInput
            placeholder="Key"
            value={key}
            onChange={(e) => handleUpdateKey(key, e.target.value)}
            size="xs"
            style={{ flex: 1 }}
          />
          <TextInput
            placeholder="Value"
            value={String(value)}
            onChange={(e) => handleUpdateValue(key, e.target.value)}
            size="xs"
            style={{ flex: 1 }}
          />
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            onClick={() => handleDeleteAttribute(key)}
          >
            <Trash2 size={12} />
          </ActionIcon>
        </Group>
      ))}
      <Button
        variant="subtle"
        size="xs"
        leftSection={<Plus size={12} />}
        onClick={handleAddAttribute}
      >
        Add Attribute
      </Button>
    </Stack>
  );
}