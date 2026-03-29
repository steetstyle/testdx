import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpanEvents } from '../../components/Spans/useSpanEvents';
import { SpanEvent } from '../../types';

describe('useSpanEvents', () => {
  const createHook = (events: SpanEvent[] = []) => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useSpanEvents(events, onUpdate));
    return { result, onUpdate };
  };

  describe('handleEventChange', () => {
    it('updates event name', () => {
      const events: SpanEvent[] = [{ name: 'event1', timestampOffsetMs: 0, attributes: {} }];
      const { result, onUpdate } = createHook(events);
      
      act(() => {
        result.current.handleEventChange(0, 'name', 'newName');
      });
      
      expect(onUpdate).toHaveBeenCalledWith([{ name: 'newName', timestampOffsetMs: 0, attributes: {} }]);
    });

    it('updates event timestampOffsetMs', () => {
      const events: SpanEvent[] = [{ name: 'event1', timestampOffsetMs: 0, attributes: {} }];
      const { result, onUpdate } = createHook(events);
      
      act(() => {
        result.current.handleEventChange(0, 'timestampOffsetMs', 100);
      });
      
      expect(onUpdate).toHaveBeenCalledWith([{ name: 'event1', timestampOffsetMs: 100, attributes: {} }]);
    });

    it('updates event attributes', () => {
      const events: SpanEvent[] = [{ name: 'event1', timestampOffsetMs: 0, attributes: {} }];
      const { result, onUpdate } = createHook(events);
      
      act(() => {
        result.current.handleEventChange(0, 'attributes', { key: 'value' });
      });
      
      expect(onUpdate).toHaveBeenCalledWith([{ name: 'event1', timestampOffsetMs: 0, attributes: { key: 'value' } }]);
    });
  });

  describe('handleAddEvent', () => {
    it('adds a new event with default values', () => {
      const { result, onUpdate } = createHook([]);
      
      act(() => {
        result.current.handleAddEvent();
      });
      
      expect(onUpdate).toHaveBeenCalledWith([{
        name: 'event',
        timestampOffsetMs: 0,
        attributes: {},
      }]);
    });

    it('appends to existing events', () => {
      const events: SpanEvent[] = [{ name: 'existing', timestampOffsetMs: 0, attributes: {} }];
      const { result, onUpdate } = createHook(events);
      
      act(() => {
        result.current.handleAddEvent();
      });
      
      expect(onUpdate).toHaveBeenCalledWith([
        { name: 'existing', timestampOffsetMs: 0, attributes: {} },
        { name: 'event', timestampOffsetMs: 0, attributes: {} },
      ]);
    });
  });

  describe('handleRemoveEvent', () => {
    it('removes event at index', () => {
      const events: SpanEvent[] = [
        { name: 'event1', timestampOffsetMs: 0, attributes: {} },
        { name: 'event2', timestampOffsetMs: 10, attributes: {} },
      ];
      const { result, onUpdate } = createHook(events);
      
      act(() => {
        result.current.handleRemoveEvent(0);
      });
      
      expect(onUpdate).toHaveBeenCalledWith([
        { name: 'event2', timestampOffsetMs: 10, attributes: {} },
      ]);
    });
  });
});