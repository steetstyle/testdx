import { useState, useCallback } from 'react';
import { ViewConfig, AggregationType } from '../../types';

interface UseViewEditorReturn {
  expanded: Set<number>;
  handleAdd: (views: ViewConfig[], onUpdate: (views: ViewConfig[]) => void) => void;
  handleUpdate: (idx: number, updates: Partial<ViewConfig>, views: ViewConfig[], onUpdate: (views: ViewConfig[]) => void) => void;
  handleDelete: (idx: number, views: ViewConfig[], onUpdate: (views: ViewConfig[]) => void) => void;
  toggleExpand: (idx: number) => void;
}

export function useViewEditor(): UseViewEditorReturn {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const handleAdd = useCallback((views: ViewConfig[], onUpdate: (views: ViewConfig[]) => void) => {
    const emptyView: ViewConfig = { name: '', description: '', unit: '', attributeKeys: [], aggregation: AggregationType.HISTOGRAM };
    onUpdate([...views, { ...emptyView, name: `view_${views.length + 1}` }]);
    setExpanded(prev => new Set([...prev, views.length]));
  }, []);

  const handleUpdate = useCallback((
    idx: number,
    updates: Partial<ViewConfig>,
    views: ViewConfig[],
    onUpdate: (views: ViewConfig[]) => void
  ) => {
    const newViews = [...views];
    newViews[idx] = { ...newViews[idx], ...updates };
    onUpdate(newViews);
  }, []);

  const handleDelete = useCallback((
    idx: number,
    views: ViewConfig[],
    onUpdate: (views: ViewConfig[]) => void
  ) => {
    onUpdate(views.filter((_, i) => i !== idx));
    setExpanded(prev => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
  }, []);

  const toggleExpand = useCallback((idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }, []);

  return {
    expanded,
    handleAdd,
    handleUpdate,
    handleDelete,
    toggleExpand,
  };
}