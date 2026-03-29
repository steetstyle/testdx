import { Stack, Card, Grid, TextInput, Select, ActionIcon, Button, Divider } from '@mantine/core';
import { Plus, Trash2 } from 'lucide-react';
import { SpanLink } from '../../types';

interface SpanLinksEditorProps {
  links: SpanLink[];
  allSpanNames: string[];
  spanId: string;
  spanName: string;
  onLinkChange: (idx: number, field: keyof SpanLink, value: unknown) => void;
  onAddLink: () => void;
  onRemoveLink: (idx: number) => void;
}

export function SpanLinksEditor({
  links,
  allSpanNames,
  spanId,
  spanName,
  onLinkChange,
  onAddLink,
  onRemoveLink,
}: SpanLinksEditorProps) {
  const linkSpanOptions = allSpanNames.filter(n => n !== spanId && n !== spanName);

  return (
    <>
      <Divider my="md" label="Links" labelPosition="left" />
      <Stack gap="xs">
        {links.map((link, idx) => (
          <Card key={idx} padding="xs" withBorder style={{ backgroundColor: 'transparent' }}>
            <Grid gutter="xs">
              <Grid.Col span={4}>
                <TextInput
                  label="Trace ID"
                  value={link.traceId}
                  onChange={(e) => onLinkChange(idx, 'traceId', e.target.value)}
                  size="xs"
                  placeholder="Full trace ID"
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Select
                  label="Span ID"
                  data={linkSpanOptions}
                  value={link.spanId}
                  onChange={(val) => onLinkChange(idx, 'spanId', val || '')}
                  size="xs"
                  clearable
                  searchable
                  placeholder="Select span"
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  label="Attributes (JSON)"
                  value={JSON.stringify(link.attributes)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      onLinkChange(idx, 'attributes', parsed);
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
                  onClick={() => onRemoveLink(idx)}
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
          onClick={onAddLink}
        >
          Add Link
        </Button>
      </Stack>
    </>
  );
}