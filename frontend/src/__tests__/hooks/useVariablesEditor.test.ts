import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVariablesEditor } from '../../hooks/useVariablesEditor';

describe('useVariablesEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with showModal false and empty variables', () => {
    const { result } = renderHook(() => useVariablesEditor());
    expect(result.current.showModal).toBe(false);
    expect(result.current.variables).toEqual({});
  });

  it('openVariables sets variables and opens modal', () => {
    const { result } = renderHook(() => useVariablesEditor());
    const initialVars = { API_KEY: 'secret', TIMEOUT: 5000 };

    act(() => {
      result.current.openVariables(initialVars);
    });

    expect(result.current.showModal).toBe(true);
    expect(result.current.variables).toEqual(initialVars);
  });

  it('openVariables handles empty/undefined initial', () => {
    const { result } = renderHook(() => useVariablesEditor());

    act(() => {
      result.current.openVariables({});
    });
    expect(result.current.variables).toEqual({});

    act(() => {
      result.current.openVariables(undefined as any);
    });
    expect(result.current.variables).toEqual({});
  });

  it('closeVariables closes modal but keeps variables', () => {
    const { result } = renderHook(() => useVariablesEditor());
    const initialVars = { KEY: 'value' };

    act(() => {
      result.current.openVariables(initialVars);
    });

    act(() => {
      result.current.closeVariables();
    });

    expect(result.current.showModal).toBe(false);
    expect(result.current.variables).toEqual(initialVars);
  });

  it('saveVariables calls onSave with variables and closes modal', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useVariablesEditor());
    const initialVars = { KEY: 'value' };

    act(() => {
      result.current.openVariables(initialVars);
    });

    await act(async () => {
      await result.current.saveVariables(onSave);
    });

    expect(onSave).toHaveBeenCalledWith(initialVars);
    expect(result.current.showModal).toBe(false);
  });

  it('saveVariables does not close modal on error', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
    const { result } = renderHook(() => useVariablesEditor());
    const initialVars = { KEY: 'value' };

    act(() => {
      result.current.openVariables(initialVars);
    });

    await act(async () => {
      await expect(result.current.saveVariables(onSave)).rejects.toThrow('Save failed');
    });

    expect(onSave).toHaveBeenCalledWith(initialVars);
    expect(result.current.showModal).toBe(true);
  });

  it('returns all required methods', () => {
    const { result } = renderHook(() => useVariablesEditor());
    expect(result.current).toHaveProperty('showModal');
    expect(result.current).toHaveProperty('variables');
    expect(result.current).toHaveProperty('openVariables');
    expect(result.current).toHaveProperty('closeVariables');
    expect(result.current).toHaveProperty('saveVariables');
    expect(typeof result.current.openVariables).toBe('function');
    expect(typeof result.current.closeVariables).toBe('function');
    expect(typeof result.current.saveVariables).toBe('function');
  });

  it('variables state is isolated per hook instance', () => {
    const { result: result1, rerender } = renderHook(() => useVariablesEditor());
    const { result: result2 } = renderHook(() => useVariablesEditor());

    act(() => {
      result1.current.openVariables({ KEY1: 'value1' });
    });
    act(() => {
      result2.current.openVariables({ KEY2: 'value2' });
    });

    expect(result1.current.variables).toEqual({ KEY1: 'value1' });
    expect(result2.current.variables).toEqual({ KEY2: 'value2' });
  });
});