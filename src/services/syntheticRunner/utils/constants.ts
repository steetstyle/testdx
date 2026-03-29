import { SpanConfig, MetricPoint, LogRecord } from '../../otel';

export const OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

export function getDefaultRootSpan(): SpanConfig {
  return {
    name: 'root-operation',
    kind: 'server',
    statusCode: 'OK',
    attributes: {},
    events: [],
    links: [],
    childSpans: 2,
    durationMs: 100,
  };
}

export function createCounterMetric(name: string): MetricPoint {
  return {
    name,
    type: 'counter',
    value: 1,
    unit: '1',
    labels: {},
  };
}

export function createDefaultLog(): LogRecord {
  return {
    severityNumber: 9,
    severityText: 'Info',
    body: 'Log message',
    attributes: {},
  };
}