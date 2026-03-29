import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpanLinks } from '../../components/Spans/useSpanLinks';
import { SpanLink } from '../../types';

describe('useSpanLinks', () => {
  const createHook = (links: SpanLink[] = []) => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useSpanLinks(links, onUpdate));
    return { result, onUpdate };
  };

  describe('handleLinkChange', () => {
    it('updates link traceId', () => {
      const links: SpanLink[] = [{ traceId: 'trace1', spanId: 'span1', attributes: {} }];
      const { result, onUpdate } = createHook(links);
      
      act(() => {
        result.current.handleLinkChange(0, 'traceId', 'newTraceId');
      });
      
      expect(onUpdate).toHaveBeenCalledWith([{ traceId: 'newTraceId', spanId: 'span1', attributes: {} }]);
    });

    it('updates link spanId', () => {
      const links: SpanLink[] = [{ traceId: 'trace1', spanId: 'span1', attributes: {} }];
      const { result, onUpdate } = createHook(links);
      
      act(() => {
        result.current.handleLinkChange(0, 'spanId', 'newSpanId');
      });
      
      expect(onUpdate).toHaveBeenCalledWith([{ traceId: 'trace1', spanId: 'newSpanId', attributes: {} }]);
    });

    it('updates link attributes', () => {
      const links: SpanLink[] = [{ traceId: 'trace1', spanId: 'span1', attributes: {} }];
      const { result, onUpdate } = createHook(links);
      
      act(() => {
        result.current.handleLinkChange(0, 'attributes', { key: 'value' });
      });
      
      expect(onUpdate).toHaveBeenCalledWith([{ traceId: 'trace1', spanId: 'span1', attributes: { key: 'value' } }]);
    });
  });

  describe('handleAddLink', () => {
    it('adds a new link with default values', () => {
      const { result, onUpdate } = createHook([]);
      
      act(() => {
        result.current.handleAddLink();
      });
      
      expect(onUpdate).toHaveBeenCalledWith([{
        traceId: '',
        spanId: '',
        attributes: {},
      }]);
    });

    it('appends to existing links', () => {
      const links: SpanLink[] = [{ traceId: 'trace1', spanId: 'span1', attributes: {} }];
      const { result, onUpdate } = createHook(links);
      
      act(() => {
        result.current.handleAddLink();
      });
      
      expect(onUpdate).toHaveBeenCalledWith([
        { traceId: 'trace1', spanId: 'span1', attributes: {} },
        { traceId: '', spanId: '', attributes: {} },
      ]);
    });
  });

  describe('handleRemoveLink', () => {
    it('removes link at index', () => {
      const links: SpanLink[] = [
        { traceId: 'trace1', spanId: 'span1', attributes: {} },
        { traceId: 'trace2', spanId: 'span2', attributes: {} },
      ];
      const { result, onUpdate } = createHook(links);
      
      act(() => {
        result.current.handleRemoveLink(0);
      });
      
      expect(onUpdate).toHaveBeenCalledWith([
        { traceId: 'trace2', spanId: 'span2', attributes: {} },
      ]);
    });
  });
});