import { Stack, Group, TextInput, ActionIcon, Button, Divider } from '@mantine/core';
import { Plus, Trash2 } from 'lucide-react';

interface MetricLabelsEditorProps {
  labels: Record<string, string>;
  onUpdate: (labels: Record<string, string>) => void;
}

export function MetricLabelsEditor({ labels, onUpdate }: MetricLabelsEditorProps) {
  const handleAddLabel = () => {
    onUpdate({ ...labels, '': '' });
  };

  const handleDeleteLabel = (key: string) => {
    const newLabels = { ...labels };
    delete newLabels[key];
    onUpdate(newLabels);
  };

  const handleUpdateKey = (oldKey: string, newKey: string) => {
    const newLabels = { ...labels };
    const value = newLabels[oldKey];
    delete newLabels[oldKey];
    newLabels[newKey] = value;
    onUpdate(newLabels);
  };

  const handleUpdateValue = (key: string, value: string) => {
    onUpdate({ ...labels, [key]: value });
  };

  return (
    <Stack gap="xs">
      {Object.entries(labels).map(([key, value]) => (
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
            value={value}
            onChange={(e) => handleUpdateValue(key, e.target.value)}
            size="xs"
            style={{ flex: 1 }}
          />
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            onClick={() => handleDeleteLabel(key)}
          >
            <Trash2 size={12} />
          </ActionIcon>
        </Group>
      ))}
      <Button
        variant="subtle"
        size="xs"
        leftSection={<Plus size={12} />}
        onClick={handleAddLabel}
      >
        Add Label
      </Button>
    </Stack>
  );
}