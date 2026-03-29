import { OtelGenerator, GenerateLogsOptions } from '../../otel';
import { TimeRangeResult } from '../utils/timeRangeCalculator';
import { createDefaultLog } from '../utils/constants';

export interface LogResult {
  recordsGenerated: number;
  errors: string[];
}

export interface LogsRunnerOptions {
  generator: OtelGenerator;
  params: any;
  rate: number;
  duration: number;
  timeRangeResult: TimeRangeResult;
  scenarioAttributes: Record<string, string>;
  signal?: { isCancelled: () => boolean };
}

export async function runLogs(options: LogsRunnerOptions): Promise<LogResult> {
  const { generator, params, rate, duration, timeRangeResult, scenarioAttributes, signal } = options;

  const logResult = await generator.generateLogs({
    logs: params.logs || [createDefaultLog()],
    count: timeRangeResult.totalExpected,
    rate,
    duration,
    includeTraceId: params.includeTraceId ?? true,
    attributes: scenarioAttributes || {},
    historicalMode: timeRangeResult.effectiveMode === 'historical',
    timeRange: timeRangeResult.effectiveTimeRange,
    signal,
  });

  return {
    recordsGenerated: logResult.recordsGenerated,
    errors: logResult.errors,
  };
}