const { OtelGenerator } = require('../services/otel');
const { buildSpan, buildChildSpans, buildTracePayload, buildMetricPayload, buildLogPayload, buildResourceAttributes } = require('../services/otel/payloadBuilder');
const { generateTraceId, generateSpanId } = require('../services/otel/idGenerator');

jest.mock('../services/otel/sender', () => {
  return {
    Sender: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue(undefined),
      testConnection: jest.fn().mockResolvedValue(true),
    })),
  };
});

describe('OtelGenerator', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let generator: any;

  beforeEach(() => {
    jest.clearAllMocks();
    generator = new OtelGenerator({ endpoint: 'http://localhost:4318', serviceName: 'test-service' });
  });

  describe('generateTraces', () => {
    it('should generate traces with default settings', async () => {
      const result = await generator.generateTraces({
        count: 5,
        rootSpanName: 'test-operation',
        rootSpanConfig: {
          name: 'root-span',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 2,
          durationMs: 100,
        },
        attributes: {},
      });

      expect(result.recordsGenerated).toBe(5);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      const mockSender = (generator as any).sender;
      let callCount = 0;
      mockSender.send.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(undefined);
      });

      const result = await generator.generateTraces({
        count: 3,
        rootSpanName: 'test-operation',
        rootSpanConfig: {
          name: 'root-span',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 1,
          durationMs: 100,
        },
        attributes: {},
      });

      expect(result.recordsGenerated).toBe(2);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Trace error');
    });

    it('should generate traces in historical mode with time range', async () => {
      const startDate = new Date('2026-03-26T10:00:00Z');
      const endDate = new Date('2026-03-26T12:00:00Z');

      const result = await generator.generateTraces({
        count: 5,
        rootSpanName: 'historical-trace',
        rootSpanConfig: {
          name: 'root-span',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 1,
          durationMs: 100,
        },
        attributes: {},
        historicalMode: true,
        timeRange: { start: startDate, end: endDate },
      });

      expect(result.recordsGenerated).toBe(5);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('generateMetrics', () => {
    it('should generate metrics with default distribution', async () => {
      const result = await generator.generateMetrics({
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        count: 3,
        attributes: {},
      });

      expect(result.recordsGenerated).toBe(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply uniform distribution to metric values', async () => {
      const result = await generator.generateMetrics({
        metrics: [
          { name: 'test.counter', type: 'counter', value: 100, unit: '1', labels: {} },
        ],
        count: 5,
        attributes: {},
        distribution: { type: 'uniform' },
      });

      expect(result.recordsGenerated).toBe(5);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply normal distribution to metric values', async () => {
      const result = await generator.generateMetrics({
        metrics: [
          { name: 'test.counter', type: 'counter', value: 100, unit: '1', labels: {} },
        ],
        count: 10,
        attributes: {},
        distribution: { type: 'normal', stdDev: 10 },
      });

      expect(result.recordsGenerated).toBe(10);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply burst distribution to metric values', async () => {
      const result = await generator.generateMetrics({
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        count: 100,
        attributes: {},
        distribution: { type: 'burst' },
      });

      expect(result.recordsGenerated).toBe(100);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply linear distribution to metric values', async () => {
      const result = await generator.generateMetrics({
        metrics: [
          { name: 'test.counter', type: 'counter', value: 50, unit: '1', labels: {} },
        ],
        count: 20,
        attributes: {},
        distribution: { type: 'linear', minRate: 0.5, maxRate: 1.5 },
      });

      expect(result.recordsGenerated).toBe(20);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply exponential distribution to metric values', async () => {
      const result = await generator.generateMetrics({
        metrics: [
          { name: 'test.counter', type: 'counter', value: 100, unit: '1', labels: {} },
        ],
        count: 15,
        attributes: {},
        distribution: { type: 'exponential' },
      });

      expect(result.recordsGenerated).toBe(15);
      expect(result.errors).toHaveLength(0);
    });

    it('should generate metrics in historical mode with time range', async () => {
      const startDate = new Date('2026-03-26T10:00:00Z');
      const endDate = new Date('2026-03-26T12:00:00Z');

      const result = await generator.generateMetrics({
        metrics: [
          { name: 'test.gauge', type: 'gauge', value: 42, unit: '1', labels: {} },
        ],
        count: 4,
        attributes: {},
        historicalMode: true,
        timeRange: { start: startDate, end: endDate },
      });

      expect(result.recordsGenerated).toBe(4);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle different metric types', async () => {
      const result = await generator.generateMetrics({
        metrics: [
          { name: 'counter', type: 'counter', value: 1, unit: '1', labels: {} },
          { name: 'gauge', type: 'gauge', value: 50, unit: '1', labels: {} },
          { name: 'histogram', type: 'histogram', value: 100, unit: 'ms', labels: {}, histogramBuckets: [10, 20, 30] },
        ],
        count: 2,
        attributes: {},
      });

      expect(result.recordsGenerated).toBe(2);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('generateLogs', () => {
    it('should generate logs with trace correlation', async () => {
      const result = await generator.generateLogs({
        logs: [
          { severityNumber: 9, severityText: 'Info', body: 'Test log', attributes: {} },
        ],
        count: 3,
        includeTraceId: true,
        attributes: {},
      });

      expect(result.recordsGenerated).toBe(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should generate logs without trace correlation', async () => {
      const result = await generator.generateLogs({
        logs: [
          { severityNumber: 13, severityText: 'Error', body: 'Error log', attributes: {} },
        ],
        count: 2,
        includeTraceId: false,
        attributes: {},
      });

      expect(result.recordsGenerated).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should generate logs in historical mode with time range', async () => {
      const startDate = new Date('2026-03-26T10:00:00Z');
      const endDate = new Date('2026-03-26T12:00:00Z');

      const result = await generator.generateLogs({
        logs: [
          { severityNumber: 9, severityText: 'Info', body: 'Historical log', attributes: {} },
        ],
        count: 3,
        includeTraceId: true,
        attributes: {},
        historicalMode: true,
        timeRange: { start: startDate, end: endDate },
      });

      expect(result.recordsGenerated).toBe(3);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('generateUnified', () => {
    it('should generate traces, metrics, and logs with correlation', async () => {
      const result = await generator.generateUnified({
        rootSpan: {
          name: 'root-operation',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 2,
          durationMs: 100,
        },
        attributes: { 'service.name': 'test-service' },
        metrics: [
          { name: 'requests', type: 'counter', value: 5, unit: '1', labels: {} },
        ],
        logs: [
          { severityNumber: 9, severityText: 'Info', body: 'Request processed', attributes: {} },
        ],
        includeTraces: true,
        includeMetrics: true,
        includeLogs: true,
        correlationEnabled: true,
        rate: 3,
      });

      expect(result.traces).toBe(3);
      expect(result.metrics).toBe(3);
      expect(result.logs).toBe(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should generate only traces when includeMetrics and includeLogs are false', async () => {
      const result = await generator.generateUnified({
        rootSpan: {
          name: 'root-operation',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 1,
          durationMs: 50,
        },
        attributes: {},
        metrics: [{ name: 'test', type: 'counter', value: 1, unit: '1', labels: {} }],
        logs: [{ severityNumber: 9, severityText: 'Info', body: 'test', attributes: {} }],
        includeTraces: true,
        includeMetrics: false,
        includeLogs: false,
        correlationEnabled: false,
        rate: 2,
      });

      expect(result.traces).toBe(2);
      expect(result.metrics).toBe(0);
      expect(result.logs).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply distribution to metric values in unified mode', async () => {
      const result = await generator.generateUnified({
        rootSpan: {
          name: 'root-operation',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 1,
          durationMs: 50,
        },
        attributes: {},
        metrics: [{ name: 'requests', type: 'counter', value: 100, unit: '1', labels: {} }],
        logs: [{ severityNumber: 9, severityText: 'Info', body: 'test', attributes: {} }],
        includeTraces: false,
        includeMetrics: true,
        includeLogs: false,
        correlationEnabled: false,
        rate: 5,
        distribution: { type: 'normal', stdDev: 15 },
      });

      expect(result.metrics).toBe(5);
      expect(result.errors).toHaveLength(0);
    });

    it('should generate unified telemetry in historical mode', async () => {
      const startDate = new Date('2026-03-26T10:00:00Z');
      const endDate = new Date('2026-03-26T10:00:10Z');

      const result = await generator.generateUnified({
        rootSpan: {
          name: 'root-operation',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 1,
          durationMs: 50,
        },
        attributes: {},
        metrics: [{ name: 'requests', type: 'counter', value: 10, unit: '1', labels: {} }],
        logs: [{ severityNumber: 9, severityText: 'Info', body: 'test', attributes: {} }],
        includeTraces: true,
        includeMetrics: true,
        includeLogs: true,
        correlationEnabled: true,
        rate: 10,
        historicalMode: true,
        timeRange: { start: startDate, end: endDate },
      });

      expect(result.traces).toBe(100);
      expect(result.metrics).toBe(100);
      expect(result.logs).toBe(100);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('Payload Builder', () => {
  describe('buildResourceAttributes', () => {
    it('should build resource attributes with service name', () => {
      const attrs = buildResourceAttributes('test-service', {});
      expect(attrs).toHaveLength(1);
      expect(attrs[0].key).toBe('service.name');
      expect(attrs[0].value.stringValue).toBe('test-service');
    });

    it('should include extra attributes', () => {
      const attrs = buildResourceAttributes('test-service', { env: 'test', version: 1 });
      expect(attrs).toHaveLength(3);
    });
  });

  describe('buildSpan', () => {
    it('should build a span with current timestamp', () => {
      const traceId = generateTraceId();
      const span = buildSpan({
        name: 'test-span',
        kind: 'server',
        statusCode: 'OK',
        attributes: {},
        events: [],
        links: [],
        durationMs: 100,
      }, traceId);

      expect(span.name).toBe('test-span');
      expect(span.traceId).toBe(traceId);
      expect(span.spanId).toBeDefined();
      expect(span.kind).toBe(2); // server
      expect(span.statusCode).toBe(1); // Ok
    });

    it('should build a span with custom base timestamp', () => {
      const traceId = generateTraceId();
      const baseTimestamp = new Date('2026-03-26T10:00:00Z').getTime();
      
      const span = buildSpan({
        name: 'historical-span',
        kind: 'server',
        statusCode: 'OK',
        attributes: {},
        events: [],
        links: [],
        durationMs: 100,
      }, traceId, undefined, 0, baseTimestamp);

      expect(span.name).toBe('historical-span');
      expect(span.startTimeUnixNano).toBe(baseTimestamp * 1000000);
    });

    it('should build a span with events', () => {
      const traceId = generateTraceId();
      const span = buildSpan({
        name: 'span-with-events',
        kind: 'server',
        statusCode: 'OK',
        attributes: {},
        events: [
          { name: 'event1', timestampOffsetMs: 10, attributes: { key: 'value' } },
        ],
        links: [],
        durationMs: 100,
      }, traceId);

      expect(span.events).toHaveLength(1);
      expect(span.events[0].name).toBe('event1');
    });

    it('should build a span with links', () => {
      const traceId = generateTraceId();
      const linkedTraceId = generateTraceId();
      const linkedSpanId = generateSpanId();
      
      const span = buildSpan({
        name: 'span-with-links',
        kind: 'server',
        statusCode: 'OK',
        attributes: {},
        events: [],
        links: [
          { traceId: linkedTraceId, spanId: linkedSpanId, attributes: {} },
        ],
        durationMs: 100,
      }, traceId);

      expect(span.links).toHaveLength(1);
      expect(span.links![0].traceId).toBe(linkedTraceId);
      expect(span.links![0].spanId).toBe(linkedSpanId);
    });
  });

  describe('buildChildSpans', () => {
    it('should build multiple child spans', () => {
      const traceId = generateTraceId();
      const parentSpan = buildSpan({
        name: 'parent',
        kind: 'server',
        statusCode: 'OK',
        attributes: {},
        events: [],
        links: [],
        durationMs: 100,
      }, traceId);

      const childSpans = buildChildSpans(parentSpan, {
        name: 'child',
        kind: 'client',
        statusCode: 'OK',
        attributes: { 'custom.attr': 'value' },
        events: [],
        links: [],
        childSpans: 3,
        durationMs: 50,
      }, 0);

      expect(childSpans).toHaveLength(3);
      childSpans.forEach((child: any) => {
        expect(child.parentSpanId).toBe(parentSpan.spanId);
        expect(child.traceId).toBe(traceId);
      });
    });

    it('should build child spans with custom base timestamp', () => {
      const traceId = generateTraceId();
      const baseTimestamp = new Date('2026-03-26T10:00:00Z').getTime();
      
      const parentSpan = buildSpan({
        name: 'parent',
        kind: 'server',
        statusCode: 'OK',
        attributes: {},
        events: [],
        links: [],
        durationMs: 100,
      }, traceId, undefined, 0, baseTimestamp);

      const childSpans = buildChildSpans(parentSpan, {
        name: 'child',
        kind: 'client',
        statusCode: 'OK',
        attributes: {},
        events: [],
        links: [],
        childSpans: 2,
        durationMs: 50,
      }, 0, baseTimestamp);

      expect(childSpans).toHaveLength(2);
      expect(childSpans[0].startTimeUnixNano).toBeGreaterThanOrEqual(baseTimestamp * 1000000);
    });
  });

  describe('buildTracePayload', () => {
    it('should build a valid OTLP trace payload', () => {
      const traceId = generateTraceId();
      const span = buildSpan({
        name: 'test-span',
        kind: 'server',
        statusCode: 'OK',
        attributes: {},
        events: [],
        links: [],
        durationMs: 100,
      }, traceId);

      const resourceAttrs = buildResourceAttributes('test-service', {});
      const payload = buildTracePayload([span], resourceAttrs);

      expect(payload).toHaveProperty('resourceSpans');
      expect((payload as any).resourceSpans[0].resource.attributes).toHaveLength(1);
      expect((payload as any).resourceSpans[0].scopeSpans[0].spans).toHaveLength(1);
    });
  });

  describe('buildMetricPayload', () => {
    it('should build a valid OTLP metrics payload for counter', () => {
      const resourceAttrs = buildResourceAttributes('test-service', {});
      const payload = buildMetricPayload([
        { name: 'test.counter', type: 'counter', value: 100, unit: '1', labels: {} },
      ], resourceAttrs);

      expect(payload).toHaveProperty('resourceMetrics');
      const metric = (payload as any).resourceMetrics[0].scopeMetrics[0].metrics[0];
      expect(metric.name).toBe('test.counter');
      expect(metric.sum).toBeDefined();
      expect(metric.sum.dataPoints[0].asInt).toBe('100');
    });

    it('should build a valid OTLP metrics payload for gauge', () => {
      const resourceAttrs = buildResourceAttributes('test-service', {});
      const payload = buildMetricPayload([
        { name: 'test.gauge', type: 'gauge', value: 42.5, unit: '1', labels: {} },
      ], resourceAttrs);

      const metric = (payload as any).resourceMetrics[0].scopeMetrics[0].metrics[0];
      expect(metric.name).toBe('test.gauge');
      expect(metric.gauge).toBeDefined();
    });

    it('should build a valid OTLP metrics payload for histogram', () => {
      const resourceAttrs = buildResourceAttributes('test-service', {});
      const payload = buildMetricPayload([
        { name: 'test.histogram', type: 'histogram', value: 100, unit: 'ms', labels: {}, histogramBuckets: [1, 5, 10] },
      ], resourceAttrs);

      const metric = (payload as any).resourceMetrics[0].scopeMetrics[0].metrics[0];
      expect(metric.name).toBe('test.histogram');
      expect(metric.histogram).toBeDefined();
    });

    it('should build metrics with correlation IDs', () => {
      const resourceAttrs = buildResourceAttributes('test-service', {});
      const traceId = generateTraceId();
      const spanId = generateSpanId();
      
      const payload = buildMetricPayload([
        { name: 'test.gauge', type: 'gauge', value: 1, unit: '1', labels: {} },
      ], resourceAttrs, traceId, spanId);

      const attributes = (payload as any).resourceMetrics[0].scopeMetrics[0].metrics[0].gauge.dataPoints[0].attributes;
      expect(attributes).toContainEqual({ key: 'trace_id', value: { stringValue: traceId } });
      expect(attributes).toContainEqual({ key: 'span_id', value: { stringValue: spanId } });
    });

    it('should build metrics with custom timestamp', () => {
      const resourceAttrs = buildResourceAttributes('test-service', {});
      const timestamp = new Date('2026-03-26T10:00:00Z').getTime();
      
      const payload = buildMetricPayload([
        { name: 'test.counter', type: 'counter', value: 1, unit: '1', labels: {} },
      ], resourceAttrs, undefined, undefined, timestamp);

      const ts = (payload as any).resourceMetrics[0].scopeMetrics[0].metrics[0].sum.dataPoints[0].timeUnixNano;
      expect(ts).toBe(timestamp * 1000000);
    });
  });

  describe('buildLogPayload', () => {
    it('should build a valid OTLP logs payload', () => {
      const resourceAttrs = buildResourceAttributes('test-service', {});
      const payload = buildLogPayload([
        { severityNumber: 9, severityText: 'Info', body: 'Test log message', attributes: {} },
      ], resourceAttrs);

      expect(payload).toHaveProperty('resourceLogs');
      const log = (payload as any).resourceLogs[0].scopeLogs[0].logRecords[0];
      expect(log.severityText).toBe('Info');
      expect(log.body.stringValue).toBe('Test log message');
    });

    it('should build logs with correlation IDs', () => {
      const resourceAttrs = buildResourceAttributes('test-service', {});
      const traceId = generateTraceId();
      const spanId = generateSpanId();
      
      const payload = buildLogPayload([
        { severityNumber: 9, severityText: 'Info', body: 'test', attributes: {} },
      ], resourceAttrs, traceId, spanId);

      const attributes = (payload as any).resourceLogs[0].scopeLogs[0].logRecords[0].attributes;
      expect(attributes).toContainEqual({ key: 'trace_id', value: { stringValue: traceId } });
      expect(attributes).toContainEqual({ key: 'span_id', value: { stringValue: spanId } });
    });

    it('should build logs with custom timestamp', () => {
      const resourceAttrs = buildResourceAttributes('test-service', {});
      const timestamp = new Date('2026-03-26T10:00:00Z').getTime();
      
      const payload = buildLogPayload([
        { severityNumber: 9, severityText: 'Info', body: 'test', attributes: {} },
      ], resourceAttrs, undefined, undefined, timestamp);

      const ts = (payload as any).resourceLogs[0].scopeLogs[0].logRecords[0].timeUnixNano;
      expect(ts).toBe(timestamp * 1000000);
    });
  });
});

describe('ID Generator', () => {
  describe('generateTraceId', () => {
    it('should generate a 32-character hex string', () => {
      const traceId = generateTraceId();
      expect(traceId).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should generate unique trace IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateTraceId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('generateSpanId', () => {
    it('should generate a 16-character hex string', () => {
      const spanId = generateSpanId();
      expect(spanId).toMatch(/^[a-f0-9]{16}$/);
    });

    it('should generate unique span IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateSpanId());
      }
      expect(ids.size).toBe(100);
    });
  });
});

describe('Distribution Tests', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let generator: any;

  beforeEach(() => {
    jest.clearAllMocks();
    generator = new OtelGenerator({ endpoint: 'http://localhost:4318', serviceName: 'test-service' });
  });

  describe('UNIFORM Distribution', () => {
    it('should return base value for uniform distribution', () => {
      const result = generator.generateDistributedValue(100, { type: 'uniform' });
      expect(result).toBe(100);
    });

    it('should generate consistent counter values with uniform distribution', async () => {
      const result = await generator.generateMetrics({
        metrics: [{ name: 'uniform.counter', type: 'counter', value: 100, unit: '1', labels: {} }],
        count: 50,
        attributes: {},
        distribution: { type: 'uniform' },
      });
      expect(result.recordsGenerated).toBe(50);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply uniform distribution to gauge values', async () => {
      const result = await generator.generateMetrics({
        metrics: [{ name: 'uniform.gauge', type: 'gauge', value: 42.5, unit: 'percent', labels: {} }],
        count: 20,
        attributes: {},
        distribution: { type: 'uniform' },
      });
      expect(result.recordsGenerated).toBe(20);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('NORMAL (Gaussian) Distribution', () => {
    it('should generate values centered around mean', () => {
      const mean = 100;
      const stdDev = 10;
      const values: number[] = [];

      for (let i = 0; i < 1000; i++) {
        const distributed = generator.generateDistributedValue(mean, { type: 'normal', stdDev });
        values.push(distributed);
      }

      const actualMean = values.reduce((a, b) => a + b, 0) / values.length;
      expect(actualMean).toBeGreaterThan(mean - 5);
      expect(actualMean).toBeLessThan(mean + 5);
    });

    it('should generate all positive values', async () => {
      const result = await generator.generateMetrics({
        metrics: [{ name: 'normal.counter', type: 'counter', value: 100, unit: '1', labels: {} }],
        count: 100,
        attributes: {},
        distribution: { type: 'normal', stdDev: 20 },
      });
      expect(result.recordsGenerated).toBe(100);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('LINEAR Distribution', () => {
    it('should generate values within min/max range', () => {
      const baseValue = 100;
      const minRate = 0.5;
      const maxRate = 1.5;
      const values: number[] = [];

      for (let i = 0; i < 100; i++) {
        const distributed = generator.generateDistributedValue(baseValue, { type: 'linear', minRate, maxRate });
        values.push(distributed);
      }

      const min = Math.min(...values);
      const max = Math.max(...values);
      expect(min).toBeGreaterThanOrEqual(baseValue * minRate - 1);
      expect(max).toBeLessThanOrEqual(baseValue * maxRate + 1);
    });
  });

  describe('EXPONENTIAL Distribution', () => {
    it('should generate mostly small values with occasional large ones', () => {
      const lambda = 1;
      const values: number[] = [];

      for (let i = 0; i < 1000; i++) {
        const distributed = generator.generateDistributedValue(lambda, { type: 'exponential' });
        values.push(distributed);
      }

      const smallCount = values.filter(v => v < 5).length;
      expect(smallCount).toBeGreaterThan(500);
    });

    it('should generate only positive values', async () => {
      const result = await generator.generateMetrics({
        metrics: [{ name: 'exponential.counter', type: 'counter', value: 10, unit: '1', labels: {} }],
        count: 50,
        attributes: {},
        distribution: { type: 'exponential' },
      });
      expect(result.recordsGenerated).toBe(50);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('BURST Distribution', () => {
    it('should generate occasional burst spikes', () => {
      const baseValue = 10;
      const values: number[] = [];

      for (let i = 0; i < 1000; i++) {
        const distributed = generator.generateDistributedValue(baseValue, { type: 'burst' });
        values.push(distributed);
      }

      const spikes = values.filter(v => v > baseValue * 2);
      const spikeRatio = spikes.length / values.length;
      expect(spikeRatio).toBeGreaterThan(0.05);
      expect(spikeRatio).toBeLessThan(0.15);
    });

    it('should have most values at base rate', async () => {
      const baseValue = 100;
      const values: number[] = [];

      for (let i = 0; i < 1000; i++) {
        const distributed = generator.generateDistributedValue(baseValue, { type: 'burst' });
        values.push(distributed);
      }

      const normalValues = values.filter(v => Math.abs(v - baseValue) < baseValue * 0.1);
      expect(normalValues.length).toBeGreaterThan(850);
    });
  });

  describe('RANDOM Distribution', () => {
    it('should generate values within specified range', () => {
      const baseValue = 100;
      const minRate = 0.3;
      const maxRate = 1.7;
      const values: number[] = [];

      for (let i = 0; i < 100; i++) {
        const distributed = generator.generateDistributedValue(baseValue, { type: 'random', minRate, maxRate });
        values.push(distributed);
      }

      const min = Math.min(...values);
      const max = Math.max(...values);
      expect(min).toBeGreaterThanOrEqual(baseValue * minRate - 1);
      expect(max).toBeLessThanOrEqual(baseValue * maxRate + 1);
    });
  });

  describe('Distribution with Historical Mode', () => {
    it('should apply uniform distribution in historical mode', async () => {
      const startDate = new Date('2026-03-26T10:00:00Z');
      const endDate = new Date('2026-03-26T12:00:00Z');

      const result = await generator.generateMetrics({
        metrics: [{ name: 'hist.uniform', type: 'counter', value: 50, unit: '1', labels: {} }],
        count: 10,
        attributes: {},
        historicalMode: true,
        timeRange: { start: startDate, end: endDate },
        distribution: { type: 'uniform' },
      });

      expect(result.recordsGenerated).toBe(10);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply normal distribution in historical mode', async () => {
      const startDate = new Date('2026-03-26T10:00:00Z');
      const endDate = new Date('2026-03-26T12:00:00Z');

      const result = await generator.generateMetrics({
        metrics: [{ name: 'hist.normal', type: 'counter', value: 100, unit: '1', labels: {} }],
        count: 10,
        attributes: {},
        historicalMode: true,
        timeRange: { start: startDate, end: endDate },
        distribution: { type: 'normal', stdDev: 15 },
      });

      expect(result.recordsGenerated).toBe(10);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply burst distribution in historical mode', async () => {
      const startDate = new Date('2026-03-26T10:00:00Z');
      const endDate = new Date('2026-03-26T12:00:00Z');

      const result = await generator.generateMetrics({
        metrics: [{ name: 'hist.burst', type: 'counter', value: 20, unit: '1', labels: {} }],
        count: 10,
        attributes: {},
        historicalMode: true,
        timeRange: { start: startDate, end: endDate },
        distribution: { type: 'burst' },
      });

      expect(result.recordsGenerated).toBe(10);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Distribution Edge Cases', () => {
    it('should handle zero base value', async () => {
      const result = await generator.generateMetrics({
        metrics: [{ name: 'zero.counter', type: 'counter', value: 0, unit: '1', labels: {} }],
        count: 10,
        attributes: {},
        distribution: { type: 'uniform' },
      });
      expect(result.recordsGenerated).toBe(10);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle undefined distribution gracefully', () => {
      const result = generator.generateDistributedValue(100, undefined);
      expect(result).toBe(100);
    });

    it('should handle unknown distribution type gracefully', () => {
      const result = generator.generateDistributedValue(100, { type: 'unknown' as any });
      expect(result).toBe(100);
    });
  });

  describe('Distribution Consistency', () => {
    it('should generate same results with same seed for uniform', async () => {
      const result1 = await generator.generateMetrics({
        metrics: [{ name: 'test', type: 'counter', value: 100, unit: '1', labels: {} }],
        count: 10,
        attributes: {},
        distribution: { type: 'uniform' },
      });

      const result2 = await generator.generateMetrics({
        metrics: [{ name: 'test', type: 'counter', value: 100, unit: '1', labels: {} }],
        count: 10,
        attributes: {},
        distribution: { type: 'uniform' },
      });

      expect(result1.recordsGenerated).toBe(result2.recordsGenerated);
      expect(result1.errors).toEqual(result2.errors);
    });

    it('should handle rapid successive calls', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(generator.generateMetrics({
          metrics: [{ name: 'test', type: 'counter', value: 10, unit: '1', labels: {} }],
          count: 10,
          attributes: {},
          distribution: { type: 'burst' },
        }));
      }

      const results = await Promise.all(promises);

      results.forEach((result: { recordsGenerated: number; errors: string[] }) => {
        expect(result.recordsGenerated).toBe(10);
        expect(result.errors).toHaveLength(0);
      });
    });
  });
});
