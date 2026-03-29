import { Sender } from './sender';
import { ParentSpanConfig, buildSpan, buildChildSpans, buildTracePayload, buildResourceAttributes } from './payloadBuilder';
import { generateTraceId } from './idGenerator';

export interface GenerateTracesOptions {
  count: number;
  rate?: number;
  duration?: number;
  rootSpanName: string;
  rootSpanConfig: ParentSpanConfig;
  attributes: Record<string, string | number | boolean>;
  historicalMode?: boolean;
  timeRange?: { start: Date; end: Date };
  serviceName?: string;
  signal?: { isCancelled: () => boolean };
}

export interface TracesResult {
  recordsGenerated: number;
  errors: string[];
}

export async function generateTraces(
  sender: Sender,
  options: GenerateTracesOptions
): Promise<TracesResult> {
  const errors: string[] = [];
  let count = 0;

  const resourceAttrs = buildResourceAttributes(options.serviceName || 'synthetic-service', options.attributes);

  const timeRangeMs = options.timeRange
    ? { start: options.timeRange.start.getTime(), end: options.timeRange.end.getTime() }
    : null;

  const generateSingleTrace = async (i: number, baseTimestamp?: number) => {
    try {
      const traceId = generateTraceId();

      const rootSpan = buildSpan(options.rootSpanConfig, traceId, undefined, 0, baseTimestamp);
      const childSpans = buildChildSpans(rootSpan, {
        name: 'child-operation',
        kind: 'client',
        statusCode: 'OK',
        attributes: { 'operation.type': 'child' },
        events: [],
        childSpans: options.rootSpanConfig.childSpans,
        durationMs: Math.floor(options.rootSpanConfig.durationMs / 2),
      }, 0, baseTimestamp);

      const tracePayload = buildTracePayload([rootSpan, ...childSpans], resourceAttrs);
      await sender.send(Buffer.from(JSON.stringify(tracePayload)), '/v1/traces');
      count++;
    } catch (err) {
      errors.push(`Trace error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  console.log(`[generateTraces] Entry - historicalMode=${options.historicalMode}, duration=${options.duration}, rate=${options.rate}, timeRangeMs=${!!timeRangeMs}`);

  if (options.historicalMode && timeRangeMs) {
    for (let i = 0; i < options.count; i++) {
      const timestamp = timeRangeMs.start + ((i / options.count) * (timeRangeMs.end - timeRangeMs.start));
      await generateSingleTrace(i, timestamp);
      if (options.signal?.isCancelled()) {
        errors.push('Scenario stopped by user');
        break;
      }
    }
  } else if (options.duration && options.duration > 0 && options.rate) {
    const totalRecords = Math.floor(options.duration * options.rate);
    console.log(`[generateTraces] Duration mode: duration=${options.duration}, rate=${options.rate}, totalRecords=${totalRecords}, count=${options.count}`);
    const intervalMs = 1000 / options.rate;
    const startTime = Date.now();

    for (let i = 0; i < totalRecords; i++) {
      await generateSingleTrace(i);

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
    console.log(`[generateTraces] Duration mode completed: count=${count}`);
  } else {
    console.log(`[generateTraces] Simple mode: count=${options.count}`);
    for (let i = 0; i < options.count; i++) {
      await generateSingleTrace(i);
      if (options.signal?.isCancelled()) {
        errors.push('Scenario stopped by user');
        break;
      }
    }
  }

  return { recordsGenerated: count, errors };
}
