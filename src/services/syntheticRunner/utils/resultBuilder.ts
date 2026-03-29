import { RunMode, RunStatus } from '../../../models/scenario';
import { RunResult, RunHistoryEntry } from './types';

export interface TraceResultData {
  recordsGenerated: number;
  errors: string[];
}

export interface MetricResultData {
  recordsGenerated: number;
  errors: string[];
}

export interface LogResultData {
  recordsGenerated: number;
  errors: string[];
}

export interface UnifiedResultData {
  traces: number;
  metrics: number;
  logs: number;
  errors: string[];
}

function createRunEntry(
  status: 'success' | 'failed',
  mode: RunMode,
  recordsGenerated: number,
  tracesGenerated: number,
  metricsGenerated: number,
  logsGenerated: number,
  errors: string[],
  timestamp: string
): RunHistoryEntry {
  const uniqueErrors = [...new Set(errors)];
  return {
    timestamp,
    status,
    mode,
    recordsGenerated,
    tracesGenerated,
    metricsGenerated,
    logsGenerated,
    error: uniqueErrors.length > 0 ? uniqueErrors.join('; ') : undefined,
  };
}

export function buildTraceResult(
  data: TraceResultData,
  mode: RunMode,
  timestamp: string
): { runResult: RunResult; runEntry: RunHistoryEntry } {
  const totalRecords = data.recordsGenerated;
  const errors = data.errors || [];
  
  const uniqueErrorMessages = [...new Set(errors.map(e => e.split('\n')[0]))];
  const limitedErrors = uniqueErrorMessages.slice(0, 5);
  const errorSummary = limitedErrors.join('; ') + (uniqueErrorMessages.length > 5 ? ` ... and ${uniqueErrorMessages.length - 5} more` : '');

  return {
    runResult: {
      success: errors.length === 0,
      recordsGenerated: totalRecords,
      tracesGenerated: totalRecords,
      metricsGenerated: 0,
      logsGenerated: 0,
      error: uniqueErrorMessages.length > 0 ? errorSummary : undefined,
    },
    runEntry: createRunEntry(
      errors.length === 0 ? 'success' : 'failed',
      mode,
      totalRecords,
      totalRecords,
      0,
      0,
      errors,
      timestamp
    ),
  };
}

export function buildMetricResult(
  data: MetricResultData,
  mode: RunMode,
  timestamp: string
): { runResult: RunResult; runEntry: RunHistoryEntry } {
  const totalRecords = data.recordsGenerated;
  const errors = data.errors || [];

  const uniqueErrorMessages = [...new Set(errors.map(e => e.split('\n')[0]))];
  const limitedErrors = uniqueErrorMessages.slice(0, 5);
  const errorSummary = limitedErrors.join('; ') + (uniqueErrorMessages.length > 5 ? ` ... and ${uniqueErrorMessages.length - 5} more` : '');

  return {
    runResult: {
      success: errors.length === 0,
      recordsGenerated: totalRecords,
      tracesGenerated: 0,
      metricsGenerated: totalRecords,
      logsGenerated: 0,
      error: uniqueErrorMessages.length > 0 ? errorSummary : undefined,
    },
    runEntry: createRunEntry(
      errors.length === 0 ? 'success' : 'failed',
      mode,
      totalRecords,
      0,
      totalRecords,
      0,
      errors,
      timestamp
    ),
  };
}

export function buildLogResult(
  data: LogResultData,
  mode: RunMode,
  timestamp: string
): { runResult: RunResult; runEntry: RunHistoryEntry } {
  const totalRecords = data.recordsGenerated;
  const errors = data.errors || [];

  const uniqueErrorMessages = [...new Set(errors.map(e => e.split('\n')[0]))];
  const limitedErrors = uniqueErrorMessages.slice(0, 5);
  const errorSummary = limitedErrors.join('; ') + (uniqueErrorMessages.length > 5 ? ` ... and ${uniqueErrorMessages.length - 5} more` : '');

  return {
    runResult: {
      success: errors.length === 0,
      recordsGenerated: totalRecords,
      tracesGenerated: 0,
      metricsGenerated: 0,
      logsGenerated: totalRecords,
      error: uniqueErrorMessages.length > 0 ? errorSummary : undefined,
    },
    runEntry: createRunEntry(
      errors.length === 0 ? 'success' : 'failed',
      mode,
      totalRecords,
      0,
      0,
      totalRecords,
      errors,
      timestamp
    ),
  };
}

export function buildUnifiedResult(
  data: UnifiedResultData,
  mode: RunMode,
  timestamp: string
): { runResult: RunResult; runEntry: RunHistoryEntry } {
  const totalRecords = data.traces + data.metrics + data.logs;
  
  const firstError = data.errors[0] ? (data.errors[0].length > 200 ? data.errors[0].substring(0, 200) + '...' : data.errors[0]) : undefined;

  const runResult: RunResult = {
    success: data.errors.length === 0,
    recordsGenerated: totalRecords,
    tracesGenerated: data.traces,
    metricsGenerated: data.metrics,
    logsGenerated: data.logs,
    error: firstError,
  };

  const runEntry = createRunEntry(
    data.errors.length === 0 ? 'success' : 'failed',
    mode,
    totalRecords,
    data.traces,
    data.metrics,
    data.logs,
    data.errors,
    timestamp
  );

  return { runResult, runEntry };
}