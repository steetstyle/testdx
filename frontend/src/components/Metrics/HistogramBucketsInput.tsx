import { TextInput, Divider } from '@mantine/core';
import type { MetricPoint } from '../../types';
import { MetricType } from '../../types';

interface HistogramBucketsInputProps {
  metric: MetricPoint;
  onUpdate: (updates: Partial<MetricPoint>) => void;
}

export function HistogramBucketsInput({ metric, onUpdate }: HistogramBucketsInputProps) {
  if (metric.type !== MetricType.HISTOGRAM) {
    return null;
  }

  const handleChange = (value: string) => {
    const buckets = value
      .split(',')
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n));
    onUpdate({ histogramBuckets: buckets });
  };

  return (
    <>
      <Divider my="sm" label="Histogram Buckets" labelPosition="left" />
      <TextInput
        label="Bucket Boundaries (comma-separated)"
        value={(metric.histogramBuckets || []).join(', ')}
        onChange={(e) => handleChange(e.target.value)}
        size="sm"
        placeholder="0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10"
      />
    </>
  );
}