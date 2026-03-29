import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStaleRef } from '../../hooks/useStaleRef';

describe('useStaleRef', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial value', () => {
    const { result } = renderHook(() => useStaleRef('initial'));
    expect(result.current.current).toBe('initial');
  });

  it('returns current value', () => {
    const { result, rerender } = renderHook(({ value }) => useStaleRef(value), {
      initialProps: { value: 'initial' },
    });

    expect(result.current.current).toBe('initial');

    rerender({ value: 'updated' });
    expect(result.current.current).toBe('updated');
  });

  it('returns same ref object across renders', () => {
    const { result, rerender } = renderHook(({ value }) => useStaleRef(value), {
      initialProps: { value: 'initial' },
    });

    const firstRef = result.current;

    rerender({ value: 'updated' });
    expect(result.current).toBe(firstRef);
  });

  it('handles object values', () => {
    const obj = { key: 'value' };
    const { result } = renderHook(() => useStaleRef(obj));
    expect(result.current.current).toBe(obj);
  });

  it('handles null and undefined values', () => {
    const { result: result1, rerender: rerender1 } = renderHook(({ value }) => useStaleRef(value), {
      initialProps: { value: null },
    });
    expect(result1.current.current).toBe(null);

    rerender1({ value: undefined });
    expect(result1.current.current).toBe(undefined);
  });

  it('handles number values', () => {
    const { result, rerender } = renderHook(({ value }) => useStaleRef(value), {
      initialProps: { value: 0 },
    });

    expect(result.current.current).toBe(0);

    rerender({ value: 42 });
    expect(result.current.current).toBe(42);
  });

  it('handles array values', () => {
    const arr = [1, 2, 3];
    const { result } = renderHook(() => useStaleRef(arr));
    expect(result.current.current).toEqual([1, 2, 3]);
  });
});