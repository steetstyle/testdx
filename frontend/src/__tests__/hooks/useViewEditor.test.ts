import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewEditor } from '../../components/OTelConfig/useViewEditor';
import { ViewConfig, AggregationType } from '../../types';

describe('useViewEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty expanded set', () => {
    const { result } = renderHook(() => useViewEditor());
    expect(result.current.expanded).toEqual(new Set());
  });

  describe('handleAdd', () => {
    it('adds a new view with default values', () => {
      const { result } = renderHook(() => useViewEditor());
      const views: ViewConfig[] = [];
      const onUpdate = vi.fn();
      
      act(() => {
        result.current.handleAdd(views, onUpdate);
      });
      
      expect(onUpdate).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'view_1',
          description: '',
          unit: '',
          attributeKeys: [],
          aggregation: AggregationType.HISTOGRAM,
        }),
      ]);
    });

    it('appends to existing views with correct naming', () => {
      const { result } = renderHook(() => useViewEditor());
      const existingViews: ViewConfig[] = [
        { name: 'existing_view', description: 'desc', unit: 'ms', attributeKeys: ['attr1'], aggregation: AggregationType.HISTOGRAM },
      ];
      const onUpdate = vi.fn();
      
      act(() => {
        result.current.handleAdd(existingViews, onUpdate);
      });
      
      expect(onUpdate).toHaveBeenCalledWith([
        ...existingViews,
        expect.objectContaining({ name: 'view_2' }),
      ]);
    });

    it('expands the newly added view', () => {
      const { result } = renderHook(() => useViewEditor());
      const views: ViewConfig[] = [];
      const onUpdate = vi.fn();
      
      act(() => {
        result.current.handleAdd(views, onUpdate);
      });
      
      expect(result.current.expanded.has(0)).toBe(true);
    });
  });

  describe('handleUpdate', () => {
    it('updates a specific view at given index', () => {
      const { result } = renderHook(() => useViewEditor());
      const views: ViewConfig[] = [
        { name: 'view1', description: 'desc1', unit: 'ms', attributeKeys: [], aggregation: AggregationType.HISTOGRAM },
        { name: 'view2', description: 'desc2', unit: 'bytes', attributeKeys: [], aggregation: AggregationType.SUM },
      ];
      const onUpdate = vi.fn();
      
      act(() => {
        result.current.handleUpdate(0, { name: 'updated_name', description: 'new_desc' }, views, onUpdate);
      });
      
      expect(onUpdate).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'updated_name', description: 'new_desc' }),
        views[1],
      ]);
    });

    it('preserves other fields when updating partial', () => {
      const { result } = renderHook(() => useViewEditor());
      const views: ViewConfig[] = [
        { name: 'view1', description: 'desc1', unit: 'ms', attributeKeys: ['key1', 'key2'], aggregation: AggregationType.HISTOGRAM },
      ];
      const onUpdate = vi.fn();
      
      act(() => {
        result.current.handleUpdate(0, { name: 'renamed' }, views, onUpdate);
      });
      
      expect(onUpdate).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'renamed',
          description: 'desc1',
          unit: 'ms',
          attributeKeys: ['key1', 'key2'],
          aggregation: AggregationType.HISTOGRAM,
        }),
      ]);
    });
  });

  describe('handleDelete', () => {
    it('removes view at specified index', () => {
      const { result } = renderHook(() => useViewEditor());
      const views: ViewConfig[] = [
        { name: 'view1', description: '', unit: '', attributeKeys: [], aggregation: AggregationType.HISTOGRAM },
        { name: 'view2', description: '', unit: '', attributeKeys: [], aggregation: AggregationType.HISTOGRAM },
        { name: 'view3', description: '', unit: '', attributeKeys: [], aggregation: AggregationType.HISTOGRAM },
      ];
      const onUpdate = vi.fn();
      
      act(() => {
        result.current.handleDelete(1, views, onUpdate);
      });
      
      expect(onUpdate).toHaveBeenCalledWith([views[0], views[2]]);
    });

    it('removes deleted index from expanded set', () => {
      const { result } = renderHook(() => useViewEditor());
      const views: ViewConfig[] = [
        { name: 'view1', description: '', unit: '', attributeKeys: [], aggregation: AggregationType.HISTOGRAM },
        { name: 'view2', description: '', unit: '', attributeKeys: [], aggregation: AggregationType.HISTOGRAM },
      ];
      const onUpdate = vi.fn();
      
      act(() => {
        result.current.handleDelete(0, views, onUpdate);
      });
      
      expect(result.current.expanded.has(0)).toBe(false);
    });
  });

  describe('toggleExpand', () => {
    it('adds index to expanded when not present', () => {
      const { result } = renderHook(() => useViewEditor());
      
      act(() => {
        result.current.toggleExpand(2);
      });
      
      expect(result.current.expanded.has(2)).toBe(true);
    });

    it('removes index from expanded when already present', () => {
      const { result } = renderHook(() => useViewEditor());
      
      act(() => {
        result.current.toggleExpand(2);
      });
      act(() => {
        result.current.toggleExpand(2);
      });
      
      expect(result.current.expanded.has(2)).toBe(false);
    });

    it('handles multiple indices independently', () => {
      const { result } = renderHook(() => useViewEditor());
      
      act(() => {
        result.current.toggleExpand(0);
        result.current.toggleExpand(1);
      });
      
      expect(result.current.expanded.has(0)).toBe(true);
      expect(result.current.expanded.has(1)).toBe(true);
      expect(result.current.expanded.has(2)).toBe(false);
      
      act(() => {
        result.current.toggleExpand(0);
      });
      
      expect(result.current.expanded.has(0)).toBe(false);
      expect(result.current.expanded.has(1)).toBe(true);
    });
  });

  it('returns all required methods', () => {
    const { result } = renderHook(() => useViewEditor());
    
    expect(result.current).toHaveProperty('expanded');
    expect(result.current).toHaveProperty('handleAdd');
    expect(result.current).toHaveProperty('handleUpdate');
    expect(result.current).toHaveProperty('handleDelete');
    expect(result.current).toHaveProperty('toggleExpand');
    expect(typeof result.current.handleAdd).toBe('function');
    expect(typeof result.current.handleUpdate).toBe('function');
    expect(typeof result.current.handleDelete).toBe('function');
    expect(typeof result.current.toggleExpand).toBe('function');
  });
});