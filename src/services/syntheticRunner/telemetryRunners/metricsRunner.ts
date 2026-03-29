import { OtelGenerator, GenerateMetricsOptions } from '../../otel';
import { TimeRangeResult } from '../utils/timeRangeCalculator';
import { createCounterMetric } from '../utils/constants';

export interface MetricResult {
  recordsGenerated: number;
  errors: string[];
}

export interface MetricsRunnerOptions {
  generator: OtelGenerator;
  params: any;
  rate: number;
  duration: number;
  timeRangeResult: TimeRangeResult;
  distribution: any;
  scenarioAttributes: Record<string, string>;
  signal?: { isCancelled: () => boolean };
}

export async function runMetrics(options: MetricsRunnerOptions): Promise<MetricResult> {
  const { generator, params, rate, duration, timeRangeResult, distribution, scenarioAttributes, signal } = options;

  console.log(`[runMetrics] rate=${rate}, duration=${duration}, totalExpected=${timeRangeResult.totalExpected}, effectiveMode=${timeRangeResult.effectiveMode}`);

  const metricResult = await generator.generateMetrics({
    metrics: params.metrics || [createCounterMetric('default.counter')],
    count: timeRangeResult.totalExpected,
    rate,
    duration,
    attributes: scenarioAttributes || {},
    historicalMode: timeRangeResult.effectiveMode === 'historical',
    timeRange: timeRangeResult.effectiveTimeRange,
    distribution: distribution,
    signal,
  });

  return {
    recordsGenerated: metricResult.recordsGenerated,
    errors: metricResult.errors,
  };
}