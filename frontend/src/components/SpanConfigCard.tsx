import { Box, Group, Text, Badge } from '@mantine/core';
import { SpanConfig as SpanConfigType } from '../types';
import { useSpanAttributes } from './Spans/useSpanAttributes';
import { useSpanEvents } from './Spans/useSpanEvents';
import { useSpanLinks } from './Spans/useSpanLinks';
import { SpanHeader } from './Spans/SpanHeader';
import { SpanAttributesEditor } from './Spans/SpanAttributesEditor';
import { SpanEventsEditor } from './Spans/SpanEventsEditor';
import { SpanLinksEditor } from './Spans/SpanLinksEditor';

interface SpanConfigCardProps {
  span: SpanConfigType | null;
  allSpanNames: string[];
  onUpdate: (updates: Partial<SpanConfigType>) => void;
}

export function SpanConfigCard({ span, allSpanNames, onUpdate }: SpanConfigCardProps) {
  if (!span) {
    return (
      <Box
        style={{
          backgroundColor: 'var(--color-bg-muted)',
          borderRadius: 8,
          border: '1px solid var(--color-border)',
          minHeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text c="dimmed" size="sm">
          Select a span to configure
        </Text>
      </Box>
    );
  }

  const { attributes, handleAttributeChange, handleAddAttribute, handleRemoveAttribute } =
    useSpanAttributes(span.attributes, (attrs) => onUpdate({ attributes: attrs }));

  const { events, handleEventChange, handleAddEvent, handleRemoveEvent } =
    useSpanEvents(span.events, (evts) => onUpdate({ events: evts }));

  const { links, handleLinkChange, handleAddLink, handleRemoveLink } =
    useSpanLinks(span.links, (lnks) => onUpdate({ links: lnks }));

  return (
    <Box
      style={{
        backgroundColor: 'var(--color-bg-muted)',
        borderRadius: 8,
        border: '1px solid var(--color-border)',
        maxHeight: 600,
        overflow: 'auto',
      }}
    >
      <Box p="md">
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <Text fw={500} size="sm">Span Configuration</Text>
            <Badge size="sm" variant="light">{span.kind}</Badge>
          </Group>
        </Group>

        <SpanHeader span={span} allSpanNames={allSpanNames} onUpdate={onUpdate} />

        <SpanAttributesEditor
          attributes={attributes}
          onAttributeChange={handleAttributeChange}
          onAddAttribute={handleAddAttribute}
          onRemoveAttribute={handleRemoveAttribute}
        />

        <SpanEventsEditor
          events={events}
          onEventChange={handleEventChange}
          onAddEvent={handleAddEvent}
          onRemoveEvent={handleRemoveEvent}
        />

        <SpanLinksEditor
          links={links}
          allSpanNames={allSpanNames}
          spanId={span.id || ''}
          spanName={span.name}
          onLinkChange={handleLinkChange}
          onAddLink={handleAddLink}
          onRemoveLink={handleRemoveLink}
        />
      </Box>
    </Box>
  );
}

export default SpanConfigCard;