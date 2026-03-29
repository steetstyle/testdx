import { Stack, Card, Grid, TextInput, NumberInput, ActionIcon, Button, Divider } from '@mantine/core';
import { Plus, Trash2 } from 'lucide-react';
import { SpanEvent } from '../../types';

interface SpanEventsEditorProps {
  events: SpanEvent[];
  onEventChange: (idx: number, field: keyof SpanEvent, value: unknown) => void;
  onAddEvent: () => void;
  onRemoveEvent: (idx: number) => void;
}

export function SpanEventsEditor({
  events,
  onEventChange,
  onAddEvent,
  onRemoveEvent,
}: SpanEventsEditorProps) {
  return (
    <>
      <Divider my="md" label="Events" labelPosition="left" />
      <Stack gap="xs">
        {events.map((event, idx) => (
          <Card key={idx} padding="xs" withBorder style={{ backgroundColor: 'transparent' }}>
            <Grid gutter="xs">
              <Grid.Col span={4}>
                <TextInput
                  label="Name"
                  value={event.name}
                  onChange={(e) => onEventChange(idx, 'name', e.target.value)}
                  size="xs"
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <NumberInput
                  label="Time Offset (ms)"
                  value={event.timestampOffsetMs}
                  onChange={(val) => onEventChange(idx, 'timestampOffsetMs', Number(val))}
                  size="xs"
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TextInput
                  label="Attributes (JSON)"
                  value={JSON.stringify(event.attributes)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      onEventChange(idx, 'attributes', parsed);
                    } catch {
                      // ignore invalid JSON
                    }
                  }}
                  size="xs"
                />
              </Grid.Col>
              <Grid.Col span={1}>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() => onRemoveEvent(idx)}
                  mt="lg"
                >
                  <Trash2 size={12} />
                </ActionIcon>
              </Grid.Col>
            </Grid>
          </Card>
        ))}
        <Button
          variant="subtle"
          size="xs"
          leftSection={<Plus size={12} />}
          onClick={onAddEvent}
        >
          Add Event
        </Button>
      </Stack>
    </>
  );
}