import { OtelGenerator, GenerateTracesOptions } from '../../otel';
import { TimeRangeResult } from '../utils/timeRangeCalculator';
import { GeneratorOptions } from '../utils/types';
import { getDefaultRootSpan } from '../utils/constants';

export interface TraceResult {
  recordsGenerated: number;
  errors: string[];
}

export interface TracesRunnerOptions {
  generator: OtelGenerator;
  params: any;
  rate: number;
  duration: number;
  timeRangeResult: TimeRangeResult;
  options: GeneratorOptions;
  scenarioAttributes: Record<string, string>;
  signal?: { isCancelled: () => boolean };
}

export async function runTraces(options: TracesRunnerOptions): Promise<TraceResult> {
  const { generator, params, rate, duration, timeRangeResult, scenarioAttributes, signal } = options;

  console.log(`[runTraces] rate=${rate}, duration=${duration}, totalExpected=${timeRangeResult.totalExpected}, effectiveMode=${timeRangeResult.effectiveMode}`);

  const traceResult = await generator.generateTraces({
    count: timeRangeResult.totalExpected,
    rate,
    duration,
    rootSpanName: params.rootSpanName || 'operation',
    rootSpanConfig: params.rootSpan || getDefaultRootSpan(),
    attributes: scenarioAttributes || {},
    historicalMode: timeRangeResult.effectiveMode === 'historical',
    timeRange: timeRangeResult.effectiveTimeRange,
    signal,
  });

  return {
    recordsGenerated: traceResult.recordsGenerated,
    errors: traceResult.errors,
  };
}