import { Sender } from './sender';
import { MetricPoint } from './types';
import { buildMetricPayload, buildResourceAttributes } from './payloadBuilder';
import { applyDistribution, DistributionConfig } from './distribution';

export interface GenerateMetricsOptions {
  metrics: MetricPoint[];
  count: number;
  rate?: number;
  duration?: number;
  attributes?: Record<string, string | number | boolean>;
  historicalMode?: boolean;
  timeRange?: { start: Date; end: Date };
  distribution?: DistributionConfig;
  serviceName?: string;
  resolver?: {
    resolveValue: (val: string | number | boolean) => string | number | boolean;
  };
  signal?: { isCancelled: () => boolean };
}

export interface MetricsResult {
  recordsGenerated: number;
  errors: string[];
}

export async function generateMetrics(
  sender: Sender,
  options: GenerateMetricsOptions
): Promise<MetricsResult> {
  const errors: string[] = [];
  let count = 0;

  const resourceAttrs = buildResourceAttributes(options.serviceName || 'synthetic-service', options.attributes ?? {});

  const timeRangeMs = options.timeRange
    ? { start: options.timeRange.start.getTime(), end: options.timeRange.end.getTime() }
    : null;

  const getDistributedValue = (baseValue: number): number => {
    return applyDistribution(baseValue, options.distribution);
  };

  const generateSingleMetric = async (i: number, timestamp?: number) => {
    try {
      const distributedMetrics = options.metrics.map(metric => {
        let resolvedValue: string | number | boolean = metric.value;
        
        if (options.resolver && typeof metric.value === 'string') {
          resolvedValue = options.resolver.resolveValue(metric.value);
        }
        
        const numericValue = typeof resolvedValue === 'number' ? resolvedValue : parseFloat(String(resolvedValue));
        const finalValue = isNaN(numericValue) ? 0 : Math.round(numericValue);
        return {
          ...metric,
          value: finalValue,
        };
      });

      const metricPayload = buildMetricPayload(
        distributedMetrics,
        resourceAttrs,
        undefined,
        undefined,
        timestamp
      );
      await sender.send(Buffer.from(JSON.stringify(metricPayload)), '/v1/metrics');
      count++;
    } catch (err) {
      errors.push(`Metric error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  console.log(`[generateMetrics] Entry - historicalMode=${options.historicalMode}, duration=${options.duration}, rate=${options.rate}, timeRangeMs=${!!timeRangeMs}, count=${options.count}`);

  if (options.historicalMode && timeRangeMs) {
    for (let i = 0; i < options.count; i++) {
      if (options.signal?.isCancelled()) {
        errors.push('Scenario stopped by user');
        break;
      }
      const timestamp = timeRangeMs.start + ((i / options.count) * (timeRangeMs.end - timeRangeMs.start));
      await generateSingleMetric(i, timestamp);
    }
  } else if (options.duration && options.duration > 0 && options.rate) {
    const totalRecords = Math.floor(options.duration * options.rate);
    console.log(`[generateMetrics] Duration mode: duration=${options.duration}, rate=${options.rate}, totalRecords=${totalRecords}`);
    const intervalMs = 1000 / options.rate;
    const startTime = Date.now();

    for (let i = 0; i < totalRecords; i++) {
      await generateSingleMetric(i);

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
    console.log(`[generateMetrics] Simple mode: count=${options.count}`);
    for (let i = 0; i < options.count; i++) {
      await generateSingleMetric(i);
      if (options.signal?.isCancelled()) {
        errors.push('Scenario stopped by user');
        break;
      }
    }
  }

  return { recordsGenerated: count, errors };
}
