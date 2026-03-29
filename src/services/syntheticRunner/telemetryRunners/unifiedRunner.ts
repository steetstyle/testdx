import { OtelGenerator } from '../../otel';
import { TimeRangeResult } from '../utils/timeRangeCalculator';
import { getDefaultRootSpan, createCounterMetric } from '../utils/constants';

export interface UnifiedResult {
  traces: number;
  metrics: number;
  logs: number;
  errors: string[];
}

export interface UnifiedRunnerOptions {
  generator: OtelGenerator;
  params: any;
  rate: number;
  rateConfig?: any;
  duration: number;
  timeRangeResult: TimeRangeResult;
  distribution: any;
  globalVariables: Record<string, any>;
  scenarioVariables: Record<string, any>;
  scenarioAttributes: Record<string, string>;
  onProgress?: (progress: any) => void;
  signal?: { isCancelled: () => boolean };
}

export async function runUnified(options: UnifiedRunnerOptions): Promise<UnifiedResult> {
  const {
    generator,
    params,
    rate,
    rateConfig,
    duration,
    timeRangeResult,
    distribution,
    globalVariables,
    scenarioVariables,
    scenarioAttributes,
    onProgress,
    signal,
  } = options;

  const result = await generator.generateUnified({
    rootSpan: params?.rootSpan || getDefaultRootSpan(),
    attributes: params?.traceAttributes || scenarioAttributes || {},
    metrics: params?.metrics?.length ? params.metrics : [createCounterMetric('synthetic.counter')],
    logs: params?.logs?.length ? params.logs : [{ severityNumber: 1, severityText: 'INFO', body: 'Synthetic log', attributes: {} }],
    includeTraces: params?.includeTraces ?? true,
    includeMetrics: params?.includeMetrics ?? true,
    includeLogs: params?.includeLogs ?? true,
    correlationEnabled: params?.correlationEnabled ?? true,
    rate,
    rateConfig,
    duration,
    historicalMode: timeRangeResult.effectiveMode === 'historical',
    timeRange: timeRangeResult.effectiveTimeRange,
    distribution: distribution,
    globalVariables,
    scenarioVariables: scenarioVariables || {},
    onProgress: onProgress,
    signal,
  });

  return {
    traces: result.traces,
    metrics: result.metrics,
    logs: result.logs,
    errors: result.errors,
  };
}