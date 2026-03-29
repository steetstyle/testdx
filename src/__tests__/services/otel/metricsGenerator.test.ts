jest.mock('../../../services/otel/sender', () => {
  return {
    Sender: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue(undefined),
      testConnection: jest.fn().mockResolvedValue(true),
    })),
  };
});

const { generateMetrics } = require('../../../services/otel/metricsGenerator');
const { Sender } = require('../../../services/otel/sender');

describe('metricsGenerator', () => {
  let mockSender: { send: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSender = new Sender() as unknown as { send: jest.Mock };
  });

  describe('generateMetrics', () => {
    it('should generate metrics with default distribution', async () => {
      const result = await generateMetrics(mockSender, {
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
      const result = await generateMetrics(mockSender, {
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
      const result = await generateMetrics(mockSender, {
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
      const result = await generateMetrics(mockSender, {
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
      const result = await generateMetrics(mockSender, {
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
      const result = await generateMetrics(mockSender, {
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

    it('should handle errors gracefully', async () => {
      let callCount = 0;
      mockSender.send.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(undefined);
      });

      const result = await generateMetrics(mockSender, {
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        count: 3,
        attributes: {},
      });

      expect(result.recordsGenerated).toBe(2);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should generate metrics in historical mode with time range', async () => {
      const startDate = new Date('2026-03-26T10:00:00Z');
      const endDate = new Date('2026-03-26T12:00:00Z');

      const result = await generateMetrics(mockSender, {
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
      const result = await generateMetrics(mockSender, {
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
          { name: 'test.gauge', type: 'gauge', value: 20, unit: '1', labels: {} },
          { name: 'test.histogram', type: 'histogram', value: 30, unit: 'ms', labels: {} },
        ],
        count: 2,
        attributes: {},
      });

      expect(result.recordsGenerated).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should use custom service name', async () => {
      await generateMetrics(mockSender, {
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        count: 1,
        attributes: {},
        serviceName: 'custom-metrics-service',
      });

      expect(mockSender.send).toHaveBeenCalledTimes(1);
      const sentData = JSON.parse(mockSender.send.mock.calls[0][0].toString());
      expect(sentData.resourceMetrics[0].resource.attributes.find(
        (attr: { key: string }) => attr.key === 'service.name'
      ).value.stringValue).toBe('custom-metrics-service');
    });

    it('should send metrics to /v1/metrics endpoint', async () => {
      await generateMetrics(mockSender, {
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        count: 1,
        attributes: {},
      });

      expect(mockSender.send).toHaveBeenCalledWith(expect.any(Buffer), '/v1/metrics');
    });

    it('should handle resolver for string values', async () => {
      const resolver = {
        resolveValue: jest.fn().mockReturnValue(42),
      };

      const result = await generateMetrics(mockSender, {
        metrics: [
          { name: 'test.counter', type: 'counter', value: '${variable}', unit: '1', labels: {} },
        ],
        count: 1,
        attributes: {},
        resolver,
      });

      expect(resolver.resolveValue).toHaveBeenCalledWith('${variable}');
      expect(result.recordsGenerated).toBe(1);
    });

    it('should handle zero count', async () => {
      const result = await generateMetrics(mockSender, {
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        count: 0,
        attributes: {},
      });

      expect(result.recordsGenerated).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockSender.send).not.toHaveBeenCalled();
    });

    it('should handle custom attributes', async () => {
      await generateMetrics(mockSender, {
        metrics: [
          { name: 'test.counter', type: 'counter', value: 10, unit: '1', labels: {} },
        ],
        count: 1,
        attributes: { 'custom.attr': 'value' },
      });

      expect(mockSender.send).toHaveBeenCalledTimes(1);
      const sentData = JSON.parse(mockSender.send.mock.calls[0][0].toString());
      expect(sentData.resourceMetrics[0].resource.attributes).toContainEqual(
        expect.objectContaining({ key: 'custom.attr', value: { stringValue: 'value' } })
      );
    });
  });
});