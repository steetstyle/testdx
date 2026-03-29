import { Stack, Group, TextInput, ActionIcon, Button, Divider } from '@mantine/core';
import { Plus, Trash2 } from 'lucide-react';

interface SpanAttributesEditorProps {
  attributes: Record<string, string | number | boolean>;
  onAttributeChange: (key: string, value: string | number | boolean, isKey: boolean) => void;
  onAddAttribute: () => void;
  onRemoveAttribute: (key: string) => void;
}

export function SpanAttributesEditor({
  attributes,
  onAttributeChange,
  onAddAttribute,
  onRemoveAttribute,
}: SpanAttributesEditorProps) {
  return (
    <>
      <Divider my="md" label="Attributes" labelPosition="left" />
      <Stack gap="xs">
        {Object.entries(attributes).map(([key, value]) => (
          <Group key={key} gap="xs">
            <TextInput
              placeholder="Key"
              value={key}
              onChange={(e) => onAttributeChange(key, e.target.value, true)}
              size="xs"
              style={{ flex: 1 }}
            />
            <TextInput
              placeholder="Value"
              value={String(value)}
              onChange={(e) => onAttributeChange(key, e.target.value, false)}
              size="xs"
              style={{ flex: 1 }}
            />
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              onClick={() => onRemoveAttribute(key)}
            >
              <Trash2 size={12} />
            </ActionIcon>
          </Group>
        ))}
        <Button
          variant="subtle"
          size="xs"
          leftSection={<Plus size={12} />}
          onClick={onAddAttribute}
        >
          Add Attribute
        </Button>
      </Stack>
    </>
  );
}