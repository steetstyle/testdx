jest.mock('../../../services/otel/sender', () => {
  return {
    Sender: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue(undefined),
      testConnection: jest.fn().mockResolvedValue(true),
    })),
  };
});

const { generateUnified } = require('../../../services/otel/unifiedGenerator');
const { Sender } = require('../../../services/otel/sender');

describe('unifiedGenerator', () => {
  let mockSender: { send: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSender = new Sender() as unknown as { send: jest.Mock };
  });

  describe('generateUnified', () => {
    it('should generate all data types with default settings', async () => {
      const result = await generateUnified(mockSender, {
        rootSpan: {
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
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        logs: [
          { body: 'Test log', severity: 'INFO', attributes: {} },
        ],
        includeTraces: true,
        includeMetrics: true,
        includeLogs: true,
        correlationEnabled: false,
        rate: 3,
      });

      expect(result.traces).toBe(3);
      expect(result.metrics).toBe(3);
      expect(result.logs).toBe(3);
      expect(result.errors).toHaveLength(0);
      expect(mockSender.send).toHaveBeenCalledTimes(9);
    });

    it('should generate only traces when includeMetrics and includeLogs are false', async () => {
      const result = await generateUnified(mockSender, {
        rootSpan: {
          name: 'root-span',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 0,
          durationMs: 100,
        },
        attributes: {},
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        logs: [
          { body: 'Test log', severity: 'INFO', attributes: {} },
        ],
        includeTraces: true,
        includeMetrics: false,
        includeLogs: false,
        correlationEnabled: false,
        rate: 5,
      });

      expect(result.traces).toBe(5);
      expect(result.metrics).toBe(0);
      expect(result.logs).toBe(0);
      expect(mockSender.send).toHaveBeenCalledTimes(5);
    });

    it('should handle errors gracefully', async () => {
      mockSender.send
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await generateUnified(mockSender, {
        rootSpan: {
          name: 'root-span',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 0,
          durationMs: 100,
        },
        attributes: {},
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        logs: [
          { body: 'Test log', severity: 'INFO', attributes: {} },
        ],
        includeTraces: true,
        includeMetrics: true,
        includeLogs: false,
        correlationEnabled: false,
        rate: 3,
      });

      expect(result.traces).toBe(2);
      expect(result.metrics).toBe(2);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle duration-based generation', async () => {
      const result = await generateUnified(mockSender, {
        rootSpan: {
          name: 'root-span',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 0,
          durationMs: 100,
        },
        attributes: {},
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        logs: [
          { body: 'Test log', severity: 'INFO', attributes: {} },
        ],
        includeTraces: true,
        includeMetrics: true,
        includeLogs: true,
        correlationEnabled: false,
        rate: 10,
        duration: 1,
      });

      expect(result.traces).toBeGreaterThan(0);
      expect(result.metrics).toBeGreaterThan(0);
      expect(result.logs).toBeGreaterThan(0);
    });

    it('should handle cancellation via signal', async () => {
      const signal = { isCancelled: jest.fn().mockReturnValue(false) };
      
      signal.isCancelled.mockReturnValueOnce(true);

      const result = await generateUnified(mockSender, {
        rootSpan: {
          name: 'root-span',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 0,
          durationMs: 100,
        },
        attributes: {},
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        logs: [
          { body: 'Test log', severity: 'INFO', attributes: {} },
        ],
        includeTraces: true,
        includeMetrics: true,
        includeLogs: true,
        correlationEnabled: false,
        rate: 10,
        signal,
      });

      expect(result.errors).toContain('Scenario stopped by user');
    });

    it('should handle historical mode with time range', async () => {
      const startDate = new Date('2026-03-26T10:00:00Z');
      const endDate = new Date('2026-03-26T10:00:10Z');

      const result = await generateUnified(mockSender, {
        rootSpan: {
          name: 'root-span',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 0,
          durationMs: 100,
        },
        attributes: {},
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        logs: [
          { body: 'Test log', severity: 'INFO', attributes: {} },
        ],
        includeTraces: true,
        includeMetrics: true,
        includeLogs: true,
        correlationEnabled: false,
        rate: 1,
        historicalMode: true,
        timeRange: { start: startDate, end: endDate },
      });

      expect(result.traces).toBeGreaterThan(0);
      expect(result.metrics).toBeGreaterThan(0);
      expect(result.logs).toBeGreaterThan(0);
    });

    it('should throw error when historicalMode is true but timeRange is not provided', async () => {
      await expect(generateUnified(mockSender, {
        rootSpan: {
          name: 'root-span',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 0,
          durationMs: 100,
        },
        attributes: {},
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        logs: [
          { body: 'Test log', severity: 'INFO', attributes: {} },
        ],
        includeTraces: true,
        includeMetrics: true,
        includeLogs: true,
        correlationEnabled: false,
        rate: 1,
        historicalMode: true,
      })).rejects.toThrow('historicalMode is true but timeRange is not provided');
    });

    it('should use custom service name', async () => {
      await generateUnified(mockSender, {
        rootSpan: {
          name: 'root-span',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 0,
          durationMs: 100,
        },
        attributes: {},
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        logs: [
          { body: 'Test log', severity: 'INFO', attributes: {} },
        ],
        includeTraces: true,
        includeMetrics: false,
        includeLogs: false,
        correlationEnabled: false,
        rate: 1,
        serviceName: 'custom-unified-service',
      });

      expect(mockSender.send).toHaveBeenCalledTimes(1);
      const sentData = JSON.parse(mockSender.send.mock.calls[0][0].toString());
      expect(sentData.resourceSpans[0].resource.attributes.find(
        (attr: { key: string }) => attr.key === 'service.name'
      ).value.stringValue).toBe('custom-unified-service');
    });

    it('should apply distribution to metrics', async () => {
      const result = await generateUnified(mockSender, {
        rootSpan: {
          name: 'root-span',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 0,
          durationMs: 100,
        },
        attributes: {},
        metrics: [
          { name: 'test.counter', type: 'counter', value: 100, unit: '1', labels: {} },
        ],
        logs: [
          { body: 'Test log', severity: 'INFO', attributes: {} },
        ],
        includeTraces: false,
        includeMetrics: true,
        includeLogs: false,
        correlationEnabled: false,
        rate: 10,
        distribution: { type: 'uniform' },
      });

      expect(result.metrics).toBe(10);
      expect(result.errors).toHaveLength(0);
    });

    it('should call onProgress callback', async () => {
      const onProgress = jest.fn();

      await generateUnified(mockSender, {
        rootSpan: {
          name: 'root-span',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 0,
          durationMs: 100,
        },
        attributes: {},
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        logs: [
          { body: 'Test log', severity: 'INFO', attributes: {} },
        ],
        includeTraces: true,
        includeMetrics: true,
        includeLogs: true,
        correlationEnabled: false,
        rate: 3,
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledTimes(3);
    });

    it('should handle correlation when correlationEnabled is true', async () => {
      await generateUnified(mockSender, {
        rootSpan: {
          name: 'root-span',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 0,
          durationMs: 100,
        },
        attributes: {},
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        logs: [
          { body: 'Test log', severity: 'INFO', attributes: {} },
        ],
        includeTraces: true,
        includeMetrics: true,
        includeLogs: true,
        correlationEnabled: true,
        rate: 1,
      });

      expect(mockSender.send).toHaveBeenCalledTimes(3);
      const traceData = JSON.parse(mockSender.send.mock.calls[0][0].toString());
      const metricData = JSON.parse(mockSender.send.mock.calls[1][0].toString());
      const logData = JSON.parse(mockSender.send.mock.calls[2][0].toString());

      expect(traceData.resourceSpans[0].scopeSpans[0].spans[0].traceId).toBeDefined();
      expect(metricData.resourceMetrics[0].scopeMetrics[0].metrics[0].name).toBe('test.counter');
    });

    it('should handle rate of zero', async () => {
      const result = await generateUnified(mockSender, {
        rootSpan: {
          name: 'root-span',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 0,
          durationMs: 100,
        },
        attributes: {},
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        logs: [
          { body: 'Test log', severity: 'INFO', attributes: {} },
        ],
        includeTraces: true,
        includeMetrics: true,
        includeLogs: true,
        correlationEnabled: false,
        rate: 0,
      });

      expect(result.traces).toBe(0);
      expect(result.metrics).toBe(0);
      expect(result.logs).toBe(0);
      expect(mockSender.send).not.toHaveBeenCalled();
    });
  });
});