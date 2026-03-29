import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpanAttributes } from '../../components/Spans/useSpanAttributes';

describe('useSpanAttributes', () => {
  const createHook = (attributes: Record<string, string | number | boolean> = {}) => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useSpanAttributes(attributes, onUpdate));
    return { result, onUpdate };
  };

  describe('handleAttributeChange', () => {
    it('updates an existing attribute value', () => {
      const { result, onUpdate } = createHook({ key1: 'value1' });
      
      act(() => {
        result.current.handleAttributeChange('key1', 'newValue', false);
      });
      
      expect(onUpdate).toHaveBeenCalledWith({ key1: 'newValue' });
    });

    it('renames an attribute key when isKey is true', () => {
      const { result, onUpdate } = createHook({ oldKey: 'value' });
      
      act(() => {
        result.current.handleAttributeChange('oldKey', 'newKey', true);
      });
      
      expect(onUpdate).toHaveBeenCalledWith({ newKey: 'value' });
    });

    it('handles renaming first attribute in a multi-attribute object', () => {
      const { result, onUpdate } = createHook({ key1: 'val1', key2: 'val2' });
      
      act(() => {
        result.current.handleAttributeChange('key1', 'renamed', true);
      });
      
      expect(onUpdate).toHaveBeenCalledWith({ renamed: 'val1', key2: 'val2' });
    });
  });

  describe('handleAddAttribute', () => {
    it('adds a new empty attribute', () => {
      const { result, onUpdate } = createHook({});
      
      act(() => {
        result.current.handleAddAttribute();
      });
      
      expect(onUpdate).toHaveBeenCalledWith({ '': '' });
    });

    it('preserves existing attributes when adding new one', () => {
      const { result, onUpdate } = createHook({ existing: 'value' });
      
      act(() => {
        result.current.handleAddAttribute();
      });
      
      expect(onUpdate).toHaveBeenCalledWith({ existing: 'value', '': '' });
    });
  });

  describe('handleRemoveAttribute', () => {
    it('removes an existing attribute', () => {
      const { result, onUpdate } = createHook({ key1: 'value1', key2: 'value2' });
      
      act(() => {
        result.current.handleRemoveAttribute('key1');
      });
      
      expect(onUpdate).toHaveBeenCalledWith({ key2: 'value2' });
    });

    it('does nothing when removing non-existent key', () => {
      const { result, onUpdate } = createHook({ key1: 'value1' });
      
      act(() => {
        result.current.handleRemoveAttribute('nonExistent');
      });
      
      expect(onUpdate).toHaveBeenCalledWith({ key1: 'value1' });
    });
  });

  describe('returned state', () => {
    it('returns the current attributes', () => {
      const attributes = { key: 'value' };
      const { result } = createHook(attributes);
      
      expect(result.current.attributes).toEqual(attributes);
    });
  });
});