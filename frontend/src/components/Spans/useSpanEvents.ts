import { useCallback } from 'react';
import { SpanEvent } from '../../types';

export function useSpanEvents(
  events: SpanEvent[],
  onUpdate: (events: SpanEvent[]) => void
) {
  const handleEventChange = useCallback(
    (idx: number, field: keyof SpanEvent, value: unknown) => {
      const newEvents = [...events];
      newEvents[idx] = { ...newEvents[idx], [field]: value as SpanEvent[keyof SpanEvent] };
      onUpdate(newEvents);
    },
    [events, onUpdate]
  );

  const handleAddEvent = useCallback(() => {
    const newEvent: SpanEvent = {
      name: 'event',
      timestampOffsetMs: 0,
      attributes: {},
    };
    onUpdate([...events, newEvent]);
  }, [events, onUpdate]);

  const handleRemoveEvent = useCallback(
    (idx: number) => {
      const newEvents = events.filter((_, i) => i !== idx);
      onUpdate(newEvents);
    },
    [events, onUpdate]
  );

  return {
    events,
    handleEventChange,
    handleAddEvent,
    handleRemoveEvent,
  };
}