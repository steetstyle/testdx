import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgressPolling } from '../../hooks/useProgressPolling';

const mockGetProgress = vi.fn();

vi.mock('../../services/api', () => ({
  scenarioApi: {
    getProgress: (...args: unknown[]) => mockGetProgress(...args),
  },
}));

describe('useProgressPolling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('initializes with null progress and isPolling false', () => {
    const { result } = renderHook(() => useProgressPolling());
    expect(result.current.progress).toBe(null);
    expect(result.current.isPolling).toBe(false);
  });

  it('startPolling initiates polling', async () => {
    const mockProgress = {
      startedAt: '2024-01-01T00:00:00Z',
      mode: 'realtime' as const,
      rate: 10,
      tracesGenerated: 100,
      metricsGenerated: 200,
      logsGenerated: 300,
      totalRecords: 600,
      totalExpected: 1000,
      status: 'running' as const,
    };
    mockGetProgress.mockResolvedValueOnce(mockProgress);

    const { result } = renderHook(() => useProgressPolling());

    act(() => {
      result.current.startPolling('scenario-123');
    });

    expect(result.current.isPolling).toBe(true);
    expect(mockGetProgress).toHaveBeenCalledWith('scenario-123');
  });

  it('stopPolling stops polling', async () => {
    const mockProgress = {
      startedAt: '2024-01-01T00:00:00Z',
      mode: 'realtime' as const,
      rate: 10,
      tracesGenerated: 100,
      metricsGenerated: 200,
      logsGenerated: 300,
      totalRecords: 600,
      status: 'running' as const,
    };
    mockGetProgress.mockResolvedValue(mockProgress);

    const { result } = renderHook(() => useProgressPolling());

    act(() => {
      result.current.startPolling('scenario-123');
    });

    await vi.advanceTimersByTimeAsync(1100);

    act(() => {
      result.current.stopPolling();
    });

    expect(result.current.isPolling).toBe(false);
  });

  it('stops polling when scenario completes', async () => {
    const completedProgress = {
      startedAt: '2024-01-01T00:00:00Z',
      mode: 'realtime' as const,
      rate: 10,
      tracesGenerated: 1000,
      metricsGenerated: 2000,
      logsGenerated: 3000,
      totalRecords: 6000,
      totalExpected: 6000,
      status: 'completed' as const,
    };
    mockGetProgress.mockResolvedValueOnce(completedProgress);

    const { result } = renderHook(() => useProgressPolling());

    act(() => {
      result.current.startPolling('scenario-123');
    });

    await vi.waitFor(() => {
      expect(result.current.progress?.status).toBe('completed');
    });
    expect(result.current.isPolling).toBe(false);
  });

  it('stops polling when scenario fails', async () => {
    const failedProgress = {
      startedAt: '2024-01-01T00:00:00Z',
      mode: 'realtime' as const,
      rate: 10,
      tracesGenerated: 100,
      metricsGenerated: 200,
      logsGenerated: 300,
      totalRecords: 600,
      status: 'failed' as const,
      error: 'Connection refused',
    };
    mockGetProgress.mockResolvedValueOnce(failedProgress);

    const { result } = renderHook(() => useProgressPolling());

    act(() => {
      result.current.startPolling('scenario-123');
    });

    await vi.waitFor(() => {
      expect(result.current.progress?.status).toBe('failed');
    });
    expect(result.current.isPolling).toBe(false);
  });

  it('returns all required methods', () => {
    const { result } = renderHook(() => useProgressPolling());
    expect(result.current).toHaveProperty('progress');
    expect(result.current).toHaveProperty('isPolling');
    expect(result.current).toHaveProperty('startPolling');
    expect(result.current).toHaveProperty('stopPolling');
    expect(typeof result.current.startPolling).toBe('function');
    expect(typeof result.current.stopPolling).toBe('function');
  });

  it('handles getProgress throwing an error gracefully', async () => {
    mockGetProgress.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProgressPolling());

    act(() => {
      result.current.startPolling('scenario-123');
    });

    await vi.advanceTimersByTimeAsync(1100);

    expect(result.current.progress).toBe(null);
    expect(result.current.isPolling).toBe(true);
  });
});