import { useState, useEffect, useCallback } from 'react';
import { scenarioApi } from '../services/api';
import type { DistributionConfig } from '../types';

export interface RatePreviewPoint {
  time: number;
  rate: number;
}

export interface RatePreviewResponse {
  duration: number;
  samples: number;
  points: RatePreviewPoint[];
}

export function useDistributionPreview(distribution: DistributionConfig, scenarioDuration: number = 60, samples: number = 60) {
  const [data, setData] = useState<RatePreviewPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await scenarioApi.previewDistribution(
        distribution,
        scenarioDuration,
        samples
      );
      setData(response.points);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preview');
    } finally {
      setLoading(false);
    }
  }, [distribution, scenarioDuration, samples]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  return { data, loading, error, refetch: fetchPreview };
}
