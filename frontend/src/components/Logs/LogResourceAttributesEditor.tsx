import { Stack, Group, TextInput, ActionIcon, Button } from '@mantine/core';
import { Plus, Trash2 } from 'lucide-react';

interface LogResourceAttributesEditorProps {
  logAttributes: Record<string, string>;
  onUpdate: (attrs: Record<string, string>) => void;
}

export function LogResourceAttributesEditor({ logAttributes, onUpdate }: LogResourceAttributesEditorProps) {
  const handleAddAttribute = () => {
    onUpdate({ ...logAttributes, '': '' });
  };

  const handleDeleteAttribute = (key: string) => {
    const newAttrs = { ...logAttributes };
    delete newAttrs[key];
    onUpdate(newAttrs);
  };

  const handleUpdateKey = (oldKey: string, newKey: string) => {
    const newAttrs = { ...logAttributes };
    const value = newAttrs[oldKey];
    delete newAttrs[oldKey];
    newAttrs[newKey] = value;
    onUpdate(newAttrs);
  };

  const handleUpdateValue = (key: string, value: string) => {
    onUpdate({ ...logAttributes, [key]: value });
  };

  return (
    <Stack gap="xs">
      {Object.entries(logAttributes).map(([key, value]) => (
        <Group key={key} gap="xs">
          <TextInput
            placeholder="Key"
            value={key}
            onChange={(e) => handleUpdateKey(key, e.target.value)}
            size="sm"
            style={{ flex: 1 }}
          />
          <TextInput
            placeholder="Value"
            value={value}
            onChange={(e) => handleUpdateValue(key, e.target.value)}
            size="sm"
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