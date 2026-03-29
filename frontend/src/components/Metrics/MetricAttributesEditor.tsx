import { Stack, Group, TextInput, ActionIcon, Button, Divider } from '@mantine/core';
import { Plus, Trash2 } from 'lucide-react';

interface MetricAttributesEditorProps {
  metricAttributes: Record<string, string>;
  onUpdate: (attrs: Record<string, string>) => void;
}

export function MetricAttributesEditor({ metricAttributes, onUpdate }: MetricAttributesEditorProps) {
  const handleAddAttribute = () => {
    onUpdate({ ...metricAttributes, '': '' });
  };

  const handleDeleteAttribute = (key: string) => {
    const newAttrs = { ...metricAttributes };
    delete newAttrs[key];
    onUpdate(newAttrs);
  };

  const handleUpdateKey = (oldKey: string, newKey: string) => {
    const newAttrs = { ...metricAttributes };
    const value = newAttrs[oldKey];
    delete newAttrs[oldKey];
    newAttrs[newKey] = value;
    onUpdate(newAttrs);
  };

  const handleUpdateValue = (key: string, value: string) => {
    onUpdate({ ...metricAttributes, [key]: value });
  };

  return (
    <Stack gap="xs">
      {Object.entries(metricAttributes).map(([key, value]) => (
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