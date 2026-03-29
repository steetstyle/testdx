import { Sender } from './sender';
import { MetricPoint, LogRecord } from './types';
import { ParentSpanConfig, buildSpan, buildChildSpans, buildTracePayload, buildMetricPayload, buildLogPayload, buildResourceAttributes } from './payloadBuilder';
import { VariableResolver } from '../variables/resolver';
import { GlobalVariables, ScenarioVariables, DistributionParams } from '../variables/types';
import { applyDistribution } from './distribution';
import { DistributionConfig } from '../../models/scenario/interfaces';

export interface GenerateUnifiedOptions {
  rootSpan: ParentSpanConfig;
  attributes: Record<string, string | number | boolean>;
  metrics: MetricPoint[];
  logs: LogRecord[];
  includeTraces: boolean;
  includeMetrics: boolean;
  includeLogs: boolean;
  correlationEnabled: boolean;
  rate: number;
  rateConfig?: any;
  duration?: number;
  historicalMode?: boolean;
  timeRange?: { start: Date; end: Date };
  distribution?: DistributionConfig | any;
  globalVariables?: GlobalVariables;
  scenarioVariables?: ScenarioVariables;
  onProgress?: (progress: { traces: number; metrics: number; logs: number; total: number }) => void;
  signal?: { isCancelled: () => boolean };
  serviceName?: string;
}

export interface UnifiedResult {
  traces: number;
  metrics: number;
  logs: number;
  errors: string[];
}

export async function generateUnified(
  sender: Sender,
  options: GenerateUnifiedOptions
): Promise<UnifiedResult> {
  const errors: string[] = [];
  let tracesCount = 0;
  let metricsCount = 0;
  let logsCount = 0;

  const resolver = new VariableResolver();
  resolver.updateContext(
    options.globalVariables,
    options.scenarioVariables,
    options.distribution as DistributionParams | undefined
  );
  resolver.resetCounters();

  const resolvedAttrs = resolver.resolveAttributes(options.attributes);
  const resourceAttrs = buildResourceAttributes(options.serviceName || 'synthetic-service', resolvedAttrs);

  const resolvedDistribution = options.distribution
    ? resolver.resolveDistribution(options.distribution as DistributionParams)
    : undefined;

  const timeRangeMs = options.timeRange
    ? { start: options.timeRange.start.getTime(), end: options.timeRange.end.getTime() }
    : null;

  const getDistributedValue = (baseValue: number): number => {
    const dist = resolvedDistribution;
    if (!dist) return baseValue;

    return applyDistribution(baseValue, {
      type: dist.type,
      stdDev: dist.stdDev,
      minRate: dist.minRate,
      maxRate: dist.maxRate,
      burstRate: dist.burstRate,
      baseRate: dist.baseRate,
      lambda: dist.lambda,
    });
  };

  const calculateRate = (iteration: number, elapsedMs: number): number => {
    const distribution = options.distribution;
    const baseRate = options.rate;
    const totalDurationMs = (options.duration || 60) * 1000;
    
    if (!distribution || typeof distribution === 'number') {
      return baseRate;
    }

    switch (distribution.type) {
      case 'fixed':
        return distribution.rate ?? baseRate;

      case 'uniform':
        return resolver.uniform(distribution.min ?? 1, distribution.max ?? 10);

      case 'gaussian':
        return resolver.gaussian(distribution.mean ?? 10, distribution.stdDev ?? 2);

      case 'linearRamp': {
        const rampDuration = (distribution.duration ?? 1) * totalDurationMs;
        const elapsed = Math.min(elapsedMs, rampDuration);
        return resolver.linearRamp(distribution.start ?? 5, distribution.end ?? 20, elapsed, rampDuration);
      }

      case 'exponentialRamp': {
        const rampDuration = (distribution.duration ?? 1) * totalDurationMs;
        const elapsed = Math.min(elapsedMs, rampDuration);
        return resolver.exponentialRamp(distribution.start ?? 5, distribution.growth ?? 1.1, elapsed, rampDuration, distribution.max);
      }

      case 'sine':
        return resolver.sineWave(
          distribution.base ?? 10,
          distribution.amplitude ?? 5,
          (distribution.period ?? 10) * 1000,
          elapsedMs,
          distribution.phase ?? 0
        );

      case 'square':
        return resolver.squareWave(
          distribution.min ?? 5,
          distribution.max ?? 20,
          (distribution.period ?? 10) * 1000,
          elapsedMs
        );

      case 'triangle':
        return resolver.triangleWave(
          distribution.min ?? 5,
          distribution.max ?? 20,
          (distribution.period ?? 10) * 1000,
          elapsedMs
        );

      case 'burst': {
        const prob = distribution.probability ?? 0.1;
        return Math.random() > (1 - prob) ? distribution.burstRate : distribution.baseRate;
      }

      case 'poisson':
        return resolver.poisson(distribution.lambda ?? 10);

      case 'exponential': {
        const lambda = distribution.lambda ?? 1;
        const interval = resolver.exponential(lambda);
        return interval > 0 ? 1 / interval : lambda;
      }

      default:
        return baseRate;
    }
  };

  const generateSingleRecord = async (iteration: number, baseTimestamp?: number) => {
    try {
      resolver.incrementIteration();
      const traceId = resolver.traceId();
      const timestamp = baseTimestamp || (timeRangeMs
        ? timeRangeMs.start + (Math.random() * (timeRangeMs.end - timeRangeMs.start))
        : Date.now());

      const resolvedDuration = resolver.resolveValue(options.rootSpan.durationMs);
      const durationNum = typeof resolvedDuration === 'number' ? resolvedDuration : parseFloat(String(resolvedDuration)) || 100;
      const distributedDuration = Math.max(1, Math.round(getDistributedValue(durationNum)));
      const childDuration = Math.max(1, Math.round(distributedDuration / 2));

    const resolvedRootAttrs = resolver.resolveAttributes(options.rootSpan.attributes);
    const resolvedChildAttrs = resolver.resolveAttributes({ 'operation.type': 'child' });

    const resolvedChildSpans = resolver.resolveValue(options.rootSpan.childSpans);
    const childSpansCount = typeof resolvedChildSpans === 'number' ? resolvedChildSpans : parseInt(String(resolvedChildSpans), 10) || 2;

    const rootSpan = buildSpan({ ...options.rootSpan, attributes: resolvedRootAttrs, durationMs: distributedDuration }, traceId, undefined, 0, timestamp);
    const childSpans = buildChildSpans(rootSpan, {
      name: 'child-operation',
      kind: 'client',
      statusCode: 'OK',
      attributes: resolvedChildAttrs,
      events: [],
      childSpans: childSpansCount,
      durationMs: childDuration,
    }, 0, timestamp);

    const allSpans = [rootSpan, ...childSpans];

    if (options.includeTraces) {
      try {
        const tracePayload = buildTracePayload(allSpans, resourceAttrs);
        await sender.send(Buffer.from(JSON.stringify(tracePayload)), '/v1/traces');
        tracesCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown';
        const truncated = msg.length > 200 ? msg.substring(0, 200) + '...' : msg;
        errors.push(`Trace error: ${truncated}`);
      }
    }

    if (options.includeMetrics) {
      try {
        const distributedMetrics = options.metrics.map(metric => {
          const rawValue = metric.value;
          const rawValueStr = typeof rawValue === 'string' ? rawValue : null;
          const isExpression = rawValueStr ? /^\$\{.*\}$/.test(rawValueStr) : false;
          const resolvedValue = rawValueStr
            ? resolver.resolveValue(rawValueStr)
            : rawValue;
          const numericValue = typeof resolvedValue === 'number' ? resolvedValue : parseFloat(String(resolvedValue));
          const baseValue = isNaN(numericValue) ? 0 : numericValue;
          const finalValue = isExpression
            ? Math.round(baseValue)
            : Math.round(getDistributedValue(baseValue));
          return {
            ...metric,
            value: finalValue,
            labels: resolver.resolveAttributes(metric.labels || {}),
          };
        });
        const metricPayload = buildMetricPayload(
          distributedMetrics,
          resourceAttrs,
          options.correlationEnabled ? traceId : undefined,
          options.correlationEnabled ? rootSpan.spanId : undefined,
          timestamp
        );
        await sender.send(Buffer.from(JSON.stringify(metricPayload)), '/v1/metrics');
        metricsCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown';
        const truncated = msg.length > 200 ? msg.substring(0, 200) + '...' : msg;
        errors.push(`Metric error: ${truncated}`);
      }
    }

    if (options.includeLogs) {
      try {
        const resolvedLogAttrs = resolver.resolveAttributes(options.logs[0]?.attributes || {});
        const logs = options.logs.map(log => ({
          ...log,
          attributes: {
            ...resolvedLogAttrs,
            ...(options.correlationEnabled ? { trace_id: traceId, span_id: rootSpan.spanId } : {}),
          },
        }));
        const logPayload = buildLogPayload(
          logs,
          resourceAttrs,
          options.correlationEnabled ? traceId : undefined,
          options.correlationEnabled ? rootSpan.spanId : undefined,
          timestamp
        );
        await sender.send(Buffer.from(JSON.stringify(logPayload)), '/v1/logs');
        logsCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown';
        const truncated = msg.length > 200 ? msg.substring(0, 200) + '...' : msg;
        errors.push(`Log error: ${truncated}`);
      }
    }

    if (options.onProgress) {
      options.onProgress({
        traces: tracesCount,
        metrics: metricsCount,
        logs: logsCount,
        total: iteration,
      });
    }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Generation error: ${msg}`);
    }
  };

  if (options.historicalMode && timeRangeMs) {
    const durationMs = timeRangeMs.end - timeRangeMs.start;
    const durationSec = Math.ceil(durationMs / 1000);
    const totalRecords = durationSec * options.rate;

    for (let i = 0; i < totalRecords; i++) {
      const elapsedMs = (i / totalRecords) * durationMs;
      const currentRate = calculateRate(i, elapsedMs);
      const timestamp = timeRangeMs.start + elapsedMs;
      await generateSingleRecord(i + 1, timestamp);
      if (options.signal?.isCancelled()) {
        errors.push('Scenario stopped by user');
        break;
      }
    }
  } else if (options.historicalMode && !timeRangeMs) {
    throw new Error('historicalMode is true but timeRange is not provided');
  } else if (options.duration && options.duration > 0) {
    const startTime = Date.now();
    const durationMs = options.duration * 1000;
    let generatedCount = 0;
    let currentTime = startTime;

    while (currentTime - startTime < durationMs) {
      const elapsedMs = currentTime - startTime;
      const currentRate = calculateRate(generatedCount, elapsedMs);
      
      await generateSingleRecord(generatedCount + 1);

      if (options.signal?.isCancelled()) {
        errors.push('Scenario stopped by user');
        break;
      }

      generatedCount++;
      const intervalMs = 1000 / currentRate;
      const expectedTime = currentTime + intervalMs;
      currentTime = Date.now();
      
      if (currentTime - startTime < durationMs) {
        const sleepTime = Math.max(0, (expectedTime - currentTime));
        if (sleepTime > 0) {
          await new Promise(resolve => setTimeout(resolve, sleepTime));
        }
        currentTime = Date.now();
      }
    }
  } else {
    const realtimeIterations = (options.duration && options.duration > 0) 
      ? Math.floor(options.duration * options.rate) 
      : options.rate;
    for (let i = 0; i < realtimeIterations; i++) {
      await generateSingleRecord(i + 1);
      if (options.signal?.isCancelled()) {
        errors.push('Scenario stopped by user');
        break;
      }
    }
  }

  return { traces: tracesCount, metrics: metricsCount, logs: logsCount, errors };
}