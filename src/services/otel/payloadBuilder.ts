import { Span, MetricPoint, LogRecord, AttributeValue, SPAN_KIND_CODES, STATUS_CODES } from './types';
import { generateTraceId, generateSpanId } from './idGenerator';

const HEX_REGEX = /^[a-fA-F0-9]+$/;
const TRACE_ID_LENGTH = 32;
const SPAN_ID_LENGTH = 16;

function isValidTraceId(traceId: string): boolean {
  return HEX_REGEX.test(traceId) && traceId.length === TRACE_ID_LENGTH;
}

function isValidSpanId(spanId: string): boolean {
  return HEX_REGEX.test(spanId) && spanId.length === SPAN_ID_LENGTH;
}

function normalizeTraceId(traceId: string): string {
  return traceId.toLowerCase();
}

function normalizeSpanId(spanId: string): string {
  return spanId.toLowerCase();
}

export function formatAttributeValue(value: string | number | boolean): AttributeValue {
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return { intValue: String(value) };
  if (typeof value === 'boolean') return { boolValue: value };
  return { stringValue: String(value) };
}

export function getKindCode(kind: string): number {
  return SPAN_KIND_CODES[kind as keyof typeof SPAN_KIND_CODES] ?? 0;
}

export function getStatusCode(code: string): number {
  return STATUS_CODES[code] ?? 0;
}

export function buildResourceAttributes(
  serviceName: string,
  extraAttributes: Record<string, string | number | boolean> = {}
): Array<{ key: string; value: AttributeValue }> {
  return [
    { key: 'service.name', value: { stringValue: serviceName } },
    ...Object.entries(extraAttributes).map(([key, value]) => ({
      key,
      value: formatAttributeValue(value),
    })),
  ];
}

export interface SingleSpanConfig {
  name: string;
  kind: string;
  statusCode: string;
  attributes: Record<string, string | number | boolean>;
  events: Array<{
    name: string;
    timestampOffsetMs: number;
    attributes: Record<string, string | number | boolean>;
  }>;
  links?: Array<{
    traceId: string;
    spanId: string;
    attributes: Record<string, string | number | boolean>;
  }>;
  durationMs: number;
}

export interface ParentSpanConfig extends SingleSpanConfig {
  childSpans: number;
}

export function buildSpan(
  config: SingleSpanConfig,
  traceId: string,
  parentSpanId?: string,
  offsetNs: number = 0,
  baseTimestamp?: number
): Span {
  const spanId = generateSpanId();
  const baseTime = baseTimestamp ? baseTimestamp * 1000000 : Date.now() * 1000000;
  
  const durationMs = typeof config.durationMs === 'number' ? config.durationMs : 
                    typeof config.durationMs === 'string' ? parseFloat(config.durationMs) || 100 : 
                    100;
  const durationNs = isNaN(durationMs) ? 100 * 1000000 : durationMs * 1000000;
  
  const startTime = baseTime + offsetNs;
  const endTime = startTime + durationNs;

  const span: Span = {
    name: config.name,
    kind: getKindCode(config.kind),
    traceId,
    spanId,
    parentSpanId,
    statusCode: getStatusCode(config.statusCode),
    statusMessage: config.statusCode === 'ERROR' ? 'Error' : '',
    startTimeUnixNano: startTime,
    endTimeUnixNano: endTime,
    attributes: Object.entries(config.attributes || {}).map(([key, value]) => ({
      key,
      value: formatAttributeValue(value),
    })),
    events: (config.events || []).map(event => ({
      timeUnixNano: startTime + event.timestampOffsetMs * 1000000,
      name: event.name,
      attributes: Object.entries(event.attributes || {}).map(([key, value]) => ({
        key,
        value: { stringValue: String(value) },
      })),
    })),
  };

  if (config.links && config.links.length > 0) {
    span.links = config.links.map(link => {
      const normalizedTraceId = isValidTraceId(link.traceId)
        ? normalizeTraceId(link.traceId)
        : generateTraceId();
      const normalizedSpanId = isValidSpanId(link.spanId)
        ? normalizeSpanId(link.spanId)
        : generateSpanId();
      return {
        traceId: normalizedTraceId,
        spanId: normalizedSpanId,
        attributes: Object.entries(link.attributes).map(([key, value]) => ({
          key,
          value: { stringValue: String(value) },
        })),
      };
    });
  }

  return span;
}

export function buildChildSpans(
  parentSpan: Span,
  childConfig: ParentSpanConfig,
  offsetNs: number,
  baseTimestamp?: number
): Span[] {
  const childSpans: Span[] = [];
  const childCount = childConfig.childSpans || 0;

  for (let i = 0; i < childCount; i++) {
    const childOffsetNs = offsetNs + (i * 10 * 1000000);
    const singleChildConfig: SingleSpanConfig = {
      name: childConfig.name,
      kind: childConfig.kind,
      statusCode: childConfig.statusCode,
      attributes: childConfig.attributes,
      events: childConfig.events,
      links: childConfig.links,
      durationMs: childConfig.durationMs,
    };
    const childSpan = buildSpan(
      singleChildConfig,
      parentSpan.traceId,
      parentSpan.spanId,
      childOffsetNs,
      baseTimestamp
    );
    childSpans.push(childSpan);
  }

  return childSpans;
}

export function buildTracePayload(
  spans: Span[],
  resourceAttributes: Array<{ key: string; value: AttributeValue }>
): object {
  return {
    resourceSpans: [{
      resource: { attributes: resourceAttributes },
      scopeSpans: [{
        schemaUrl: '',
        spans,
      }],
    }],
  };
}

export function buildMetricPayload(
  metrics: MetricPoint[],
  resourceAttributes: Array<{ key: string; value: AttributeValue }>,
  traceId?: string,
  spanId?: string,
  timestamp?: number
): object {
  const otelMetrics = metrics.map(metric => {
    const baseMetric = {
      name: metric.name,
      unit: metric.unit,
    };

    const attributes = [
      ...Object.entries(metric.labels || {}).map(([key, value]) => ({
        key,
        value: formatAttributeValue(value),
      })),
    ];

    if (traceId) {
      attributes.push({ key: 'trace_id', value: { stringValue: traceId } });
    }
    if (spanId) {
      attributes.push({ key: 'span_id', value: { stringValue: spanId } });
    }

    const ts = (timestamp || Date.now()) * 1000000;

    switch (metric.type) {
      case 'counter':
        return {
          ...baseMetric,
          sum: {
            dataPoints: [{
              asInt: String(metric.value),
              timeUnixNano: ts,
            }],
            aggregationTemporality: 2,
            isMonotonic: true,
          },
        };
      case 'gauge':
        return {
          ...baseMetric,
          gauge: {
            dataPoints: [{
              asDouble: metric.value,
              timeUnixNano: ts,
              attributes,
            }],
          },
        };
      case 'histogram':
        return {
          ...baseMetric,
          histogram: {
            dataPoints: [{
              count: String(metric.value),
              sum: metric.value * 50,
              bucketCounts: metric.histogramBuckets || [10, 20, 30, 20, 10, 5, 3, 2],
              explicitBounds: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
              timeUnixNano: ts,
              attributes,
            }],
            aggregationTemporality: 2,
          },
        };
      default:
        return {
          ...baseMetric,
          sum: {
            dataPoints: [{
              asInt: String(metric.value),
              timeUnixNano: ts,
            }],
            aggregationTemporality: 2,
            isMonotonic: false,
          },
        };
    }
  });

  return {
    resourceMetrics: [{
      resource: { attributes: resourceAttributes },
      scopeMetrics: [{
        schemaUrl: '',
        metrics: otelMetrics,
      }],
    }],
  };
}

export function buildLogPayload(
  logs: LogRecord[],
  resourceAttributes: Array<{ key: string; value: AttributeValue }>,
  traceId?: string,
  spanId?: string,
  timestamp?: number
): object {
  const ts = (timestamp || Date.now()) * 1000000;
  const otelLogs = logs.map(log => ({
    timeUnixNano: ts,
    severityNumber: log.severityNumber,
    severityText: log.severityText,
    body: { stringValue: log.body },
    attributes: [
      ...Object.entries(log.attributes).map(([key, value]) => ({
        key,
        value: { stringValue: String(value) },
      })),
      ...(traceId ? [{ key: 'trace_id', value: { stringValue: traceId } }] : []),
      ...(spanId ? [{ key: 'span_id', value: { stringValue: spanId } }] : []),
    ],
  }));

  return {
    resourceLogs: [{
      resource: { attributes: resourceAttributes },
      scopeLogs: [{
        schemaUrl: '',
        logRecords: otelLogs,
      }],
    }],
  };
}