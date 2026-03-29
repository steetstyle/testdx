jest.mock('../../../services/otel/sender', () => {
  return {
    Sender: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue(undefined),
      testConnection: jest.fn().mockResolvedValue(true),
    })),
  };
});

jest.mock('../../../services/otel/idGenerator', () => ({
  generateTraceId: jest.fn().mockReturnValue('mocked-trace-id'),
  generateSpanId: jest.fn().mockReturnValue('mocked-span-id'),
}));

const { generateTraces } = require('../../../services/otel/tracesGenerator');
const { Sender } = require('../../../services/otel/sender');

describe('tracesGenerator', () => {
  let mockSender: { send: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSender = new Sender() as unknown as { send: jest.Mock };
  });

  describe('generateTraces', () => {
    it('should generate traces with default settings', async () => {
      const result = await generateTraces(mockSender, {
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
      expect(mockSender.send).toHaveBeenCalledTimes(5);
    });

    it('should handle errors gracefully', async () => {
      let callCount = 0;
      mockSender.send.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(undefined);
      });

      const result = await generateTraces(mockSender, {
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

      const result = await generateTraces(mockSender, {
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

    it('should use custom service name', async () => {
      await generateTraces(mockSender, {
        count: 1,
        rootSpanName: 'test-operation',
        rootSpanConfig: {
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
        serviceName: 'custom-service',
      });

      expect(mockSender.send).toHaveBeenCalledTimes(1);
      const sentData = JSON.parse(mockSender.send.mock.calls[0][0].toString());
      expect(sentData.resourceSpans[0].resource.attributes.find(
        (attr: { key: string }) => attr.key === 'service.name'
      ).value.stringValue).toBe('custom-service');
    });

    it('should send traces to /v1/traces endpoint', async () => {
      await generateTraces(mockSender, {
        count: 1,
        rootSpanName: 'test-operation',
        rootSpanConfig: {
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
      });

      expect(mockSender.send).toHaveBeenCalledWith(expect.any(Buffer), '/v1/traces');
    });

    it('should generate child spans when childSpans > 0', async () => {
      await generateTraces(mockSender, {
        count: 1,
        rootSpanName: 'test-operation',
        rootSpanConfig: {
          name: 'root-span',
          kind: 'server',
          statusCode: 'OK',
          attributes: {},
          events: [],
          links: [],
          childSpans: 3,
          durationMs: 100,
        },
        attributes: {},
      });

      expect(mockSender.send).toHaveBeenCalledTimes(1);
      const sentData = JSON.parse(mockSender.send.mock.calls[0][0].toString());
      expect(sentData.resourceSpans[0].scopeSpans[0].spans.length).toBe(4);
    });

    it('should handle zero count', async () => {
      const result = await generateTraces(mockSender, {
        count: 0,
        rootSpanName: 'test-operation',
        rootSpanConfig: {
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
      });

      expect(result.recordsGenerated).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockSender.send).not.toHaveBeenCalled();
    });

    it('should handle custom attributes', async () => {
      await generateTraces(mockSender, {
        count: 1,
        rootSpanName: 'test-operation',
        rootSpanConfig: {
          name: 'root-span',
          kind: 'server',
          statusCode: 'OK',
          attributes: { 'custom.attr': 'value' },
          events: [],
          links: [],
          childSpans: 0,
          durationMs: 100,
        },
        attributes: { 'resource.attr': 'resource-value' },
      });

      expect(mockSender.send).toHaveBeenCalledTimes(1);
      const sentData = JSON.parse(mockSender.send.mock.calls[0][0].toString());
      expect(sentData.resourceSpans[0].resource.attributes).toContainEqual(
        expect.objectContaining({ key: 'resource.attr', value: { stringValue: 'resource-value' } })
      );
    });
  });
});