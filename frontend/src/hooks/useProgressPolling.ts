import { useRef, useEffect, useCallback, useState } from 'react';
import { scenarioApi } from '../services/api';
import type { RunProgress } from '../types';

export interface UseProgressPollingReturn {
  progress: RunProgress | null;
  isPolling: boolean;
  startPolling: (scenarioId: string) => void;
  stopPolling: () => void;
}

export function useProgressPolling(): UseProgressPollingReturn {
  const [progress, setProgress] = useState<RunProgress | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const startPolling = useCallback((scenarioId: string) => {
    stopPolling();

    const poll = async () => {
      try {
        const progressData = await scenarioApi.getProgress(scenarioId);
        if (progressData) {
          setProgress(progressData);
          if (progressData.status !== 'running') {
            stopPolling();
          }
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err);
      }
    };

    poll();
    setIsPolling(true);
    intervalRef.current = setInterval(poll, 1000);
  }, [stopPolling]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    progress,
    isPolling,
    startPolling,
    stopPolling,
  };
}
