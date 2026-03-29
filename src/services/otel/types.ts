export interface SpanEvent {
  name: string;
  timestampOffsetMs: number;
  attributes: Record<string, string | number | boolean>;
}

export interface SpanLink {
  traceId: string;
  spanId: string;
  attributes: Record<string, string | number | boolean>;
}

export interface Span {
  name: string;
  kind: number;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  statusCode: number;
  statusMessage: string;
  startTimeUnixNano: number;
  endTimeUnixNano: number;
  attributes: Array<{ key: string; value: AttributeValue }>;
  events: Array<{
    timeUnixNano: number;
    name: string;
    attributes: Array<{ key: string; value: AttributeValue }>;
  }>;
  links?: Array<{
    traceId: string;
    spanId: string;
    attributes: Array<{ key: string; value: AttributeValue }>;
  }>;
}

export interface AttributeValue {
  stringValue?: string;
  intValue?: string;
  doubleValue?: number;
  boolValue?: boolean;
}

export interface MetricPoint {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'exponential_histogram' | 'sum';
  value: number;
  unit: string;
  labels: Record<string, string | number | boolean>;
  histogramBuckets?: number[];
}

export interface LogRecord {
  severityNumber: number;
  severityText: string;
  body: string;
  attributes: Record<string, string | number | boolean>;
}

export interface SpanConfig {
  name: string;
  kind: string;
  statusCode: string;
  attributes: Record<string, string | number | boolean>;
  events: SpanEvent[];
  links: SpanLink[];
  childSpans: number;
  durationMs: number;
}

export type SpanKind = 'server' | 'client' | 'producer' | 'consumer' | 'internal';

export const SPAN_KIND_CODES: Record<SpanKind, number> = {
  server: 2,
  client: 3,
  producer: 4,
  consumer: 5,
  internal: 0,
};

export const STATUS_CODES: Record<string, number> = {
  OK: 1,
  ERROR: 2,
  UNSET: 0,
};