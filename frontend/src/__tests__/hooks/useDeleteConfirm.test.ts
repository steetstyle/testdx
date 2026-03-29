import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeleteConfirm } from '../../hooks/useDeleteConfirm';

describe('useDeleteConfirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultOptions = {
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    onConfirm: vi.fn().mockResolvedValue(undefined),
  };

  it('initializes with showDelete false', () => {
    const { result } = renderHook(() => useDeleteConfirm(defaultOptions));
    expect(result.current.showDelete).toBe(false);
  });

  it('confirmDelete sets showDelete to true', () => {
    const { result } = renderHook(() => useDeleteConfirm(defaultOptions));

    act(() => {
      result.current.confirmDelete();
    });

    expect(result.current.showDelete).toBe(true);
  });

  it('cancelDelete sets showDelete to false', () => {
    const { result } = renderHook(() => useDeleteConfirm(defaultOptions));

    act(() => {
      result.current.confirmDelete();
    });
    expect(result.current.showDelete).toBe(true);

    act(() => {
      result.current.cancelDelete();
    });
    expect(result.current.showDelete).toBe(false);
  });

  it('handleDelete calls onConfirm and closes modal on success', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeleteConfirm({ ...defaultOptions, onConfirm }));

    act(() => {
      result.current.confirmDelete();
    });
    expect(result.current.showDelete).toBe(true);

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(result.current.showDelete).toBe(false);
  });

  it('handleDelete does not close modal on failure', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('Delete failed'));
    const { result } = renderHook(() => useDeleteConfirm({ ...defaultOptions, onConfirm }));

    act(() => {
      result.current.confirmDelete();
    });
    expect(result.current.showDelete).toBe(true);

    await act(async () => {
      await expect(result.current.handleDelete()).rejects.toThrow('Delete failed');
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(result.current.showDelete).toBe(true);
  });

  it('returns all required methods', () => {
    const { result } = renderHook(() => useDeleteConfirm(defaultOptions));
    expect(result.current).toHaveProperty('showDelete');
    expect(result.current).toHaveProperty('confirmDelete');
    expect(result.current).toHaveProperty('cancelDelete');
    expect(result.current).toHaveProperty('handleDelete');
    expect(typeof result.current.confirmDelete).toBe('function');
    expect(typeof result.current.cancelDelete).toBe('function');
    expect(typeof result.current.handleDelete).toBe('function');
  });
});