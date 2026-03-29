import { Sender } from './sender';
import { LogRecord } from './types';
import { buildLogPayload, buildResourceAttributes } from './payloadBuilder';
import { generateTraceId } from './idGenerator';

export interface GenerateLogsOptions {
  logs: LogRecord[];
  count: number;
  rate?: number;
  duration?: number;
  includeTraceId: boolean;
  attributes?: Record<string, string | number | boolean>;
  historicalMode?: boolean;
  timeRange?: { start: Date; end: Date };
  serviceName?: string;
  signal?: { isCancelled: () => boolean };
}

export interface LogsResult {
  recordsGenerated: number;
  errors: string[];
}

export async function generateLogs(
  sender: Sender,
  options: GenerateLogsOptions
): Promise<LogsResult> {
  const errors: string[] = [];
  let count = 0;

  const resourceAttrs = buildResourceAttributes(options.serviceName || 'synthetic-service', options.attributes ?? {});

  const timeRangeMs = options.timeRange
    ? { start: options.timeRange.start.getTime(), end: options.timeRange.end.getTime() }
    : null;

  const generateSingleLog = async (i: number, timestamp?: number) => {
    try {
      const traceId = options.includeTraceId ? generateTraceId() : undefined;
      const logs = options.logs.map(log => ({
        ...log,
        attributes: {
          ...log.attributes,
          ...(traceId ? { trace_id: traceId } : {}),
        },
      }));
      const logPayload = buildLogPayload(logs, resourceAttrs, traceId, undefined, timestamp);
      await sender.send(Buffer.from(JSON.stringify(logPayload)), '/v1/logs');
      count++;
    } catch (err) {
      errors.push(`Log error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (options.historicalMode && timeRangeMs) {
    for (let i = 0; i < options.count; i++) {
      if (options.signal?.isCancelled()) {
        errors.push('Scenario stopped by user');
        break;
      }
      const timestamp = timeRangeMs.start + ((i / options.count) * (timeRangeMs.end - timeRangeMs.start));
      await generateSingleLog(i, timestamp);
    }
  } else if (options.duration && options.duration > 0 && options.rate) {
    const totalRecords = Math.floor(options.duration * options.rate);
    const intervalMs = 1000 / options.rate;
    const startTime = Date.now();

    for (let i = 0; i < totalRecords; i++) {
      if (options.signal?.isCancelled()) {
        errors.push('Scenario stopped by user');
        break;
      }
      await generateSingleLog(i);

      if (options.signal?.isCancelled()) {
        errors.push('Scenario stopped by user');
        break;
      }

      if (i < totalRecords - 1) {
        const expectedElapsed = (i + 1) * intervalMs;
        const actualElapsed = Date.now() - startTime;
        const sleepTime = expectedElapsed - actualElapsed;
        if (sleepTime > 0) {
          await new Promise(resolve => setTimeout(resolve, sleepTime));
        }
      }
    }
  } else {
    for (let i = 0; i < options.count; i++) {
      await generateSingleLog(i);
      if (options.signal?.isCancelled()) {
        errors.push('Scenario stopped by user');
        break;
      }
    }
  }

  return { recordsGenerated: count, errors };
}
