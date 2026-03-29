const mockGenerateUnified = jest.fn();

jest.mock('../../../services/otel', () => ({
  OtelGenerator: jest.fn().mockImplementation(() => ({
    generateUnified: mockGenerateUnified,
  })),
}));

jest.mock('../../../services/syntheticRunner/utils/constants', () => ({
  getDefaultRootSpan: () => ({
    name: 'default-span',
    kind: 'server',
    statusCode: 'OK',
    attributes: {},
    events: [],
    links: [],
    childSpans: 1,
    durationMs: 100,
  }),
  createCounterMetric: (name: string) => ({
    name,
    type: 'counter',
    value: 1,
    unit: '1',
    labels: {},
  }),
}));

import { runUnified } from '../../../services/syntheticRunner/telemetryRunners/unifiedRunner';
import type { UnifiedRunnerOptions } from '../../../services/syntheticRunner/telemetryRunners/unifiedRunner';

describe('unifiedRunner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateUnified.mockResolvedValue({ traces: 10, metrics: 10, logs: 10, errors: [] });
  });

  describe('runUnified', () => {
    const createMockGenerator = () => ({
      generateUnified: mockGenerateUnified,
    });

    const baseOptions: UnifiedRunnerOptions = {
      generator: createMockGenerator() as any,
      params: {},
      rate: 10,
      duration: 60,
      timeRangeResult: {
        effectiveMode: 'realtime',
        effectiveTimeRange: undefined,
        totalExpected: 600,
      },
      distribution: { type: 'uniform' },
      globalVariables: {},
      scenarioVariables: {},
      scenarioAttributes: {},
    };

    it('should pass through metrics and logs when provided', async () => {
      const params = {
        metrics: [{ name: 'custom.metric', type: 'counter' as const, value: 5, unit: '1', labels: {} }],
        logs: [{ severityNumber: 9, severityText: 'Info', body: 'custom log', attributes: {} }],
      };

      await runUnified({ ...baseOptions, params });

      expect(mockGenerateUnified).toHaveBeenCalledWith(
        expect.objectContaining({
          metrics: [{ name: 'custom.metric', type: 'counter', value: 5, unit: '1', labels: {} }],
          logs: [{ severityNumber: 9, severityText: 'Info', body: 'custom log', attributes: {} }],
        })
      );
    });

    it('should provide default counter metric when params.metrics is empty array', async () => {
      const params = {
        metrics: [],
        logs: [{ severityNumber: 9, severityText: 'Info', body: 'test', attributes: {} }],
      };

      await runUnified({ ...baseOptions, params });

      expect(mockGenerateUnified).toHaveBeenCalledWith(
        expect.objectContaining({
          metrics: expect.arrayContaining([
            expect.objectContaining({
              name: 'synthetic.counter',
              type: 'counter',
            }),
          ]),
        })
      );
    });

    it('should provide default log when params.logs is empty array', async () => {
      const params = {
        metrics: [{ name: 'custom.metric', type: 'counter', value: 5, unit: '1', labels: {} }],
        logs: [],
      };

      await runUnified({ ...baseOptions, params });

      expect(mockGenerateUnified).toHaveBeenCalledWith(
        expect.objectContaining({
          logs: expect.arrayContaining([
            expect.objectContaining({
              body: 'Synthetic log',
              severityNumber: 1,
              severityText: 'INFO',
            }),
          ]),
        })
      );
    });

    it('should provide defaults when both metrics and logs are empty', async () => {
      const params = {
        metrics: [],
        logs: [],
      };

      await runUnified({ ...baseOptions, params });

      expect(mockGenerateUnified).toHaveBeenCalledWith(
        expect.objectContaining({
          metrics: expect.arrayContaining([
            expect.objectContaining({ name: 'synthetic.counter' }),
          ]),
          logs: expect.arrayContaining([
            expect.objectContaining({ body: 'Synthetic log' }),
          ]),
        })
      );
    });

    it('should pass through includeTraces, includeMetrics, includeLogs flags', async () => {
      const params = {
        metrics: [],
        logs: [],
        includeTraces: false,
        includeMetrics: true,
        includeLogs: false,
      };

      await runUnified({ ...baseOptions, params });

      expect(mockGenerateUnified).toHaveBeenCalledWith(
        expect.objectContaining({
          includeTraces: false,
          includeMetrics: true,
          includeLogs: false,
        })
      );
    });

    it('should set historicalMode based on timeRangeResult.effectiveMode', async () => {
      const historicalTimeRangeResult = {
        effectiveMode: 'historical' as const,
        effectiveTimeRange: { start: new Date('2026-03-26T10:00:00Z'), end: new Date('2026-03-26T10:01:00Z') },
        totalExpected: 600,
      };

      await runUnified({ ...baseOptions, timeRangeResult: historicalTimeRangeResult });

      expect(mockGenerateUnified).toHaveBeenCalledWith(
        expect.objectContaining({
          historicalMode: true,
          timeRange: historicalTimeRangeResult.effectiveTimeRange,
        })
      );
    });

    it('should set historicalMode to false for realtime mode', async () => {
      await runUnified(baseOptions);

      expect(mockGenerateUnified).toHaveBeenCalledWith(
        expect.objectContaining({
          historicalMode: false,
        })
      );
    });

    it('should pass rate and duration to generator', async () => {
      await runUnified({ ...baseOptions, rate: 50, duration: 120 });

      expect(mockGenerateUnified).toHaveBeenCalledWith(
        expect.objectContaining({
          rate: 50,
          duration: 120,
        })
      );
    });

    it('should pass globalVariables and scenarioVariables', async () => {
      const globalVars = { env: 'production', region: 'us-west-2' };
      const scenarioVars = { sessionId: 'abc123' };

      await runUnified({ ...baseOptions, globalVariables: globalVars, scenarioVariables: scenarioVars });

      expect(mockGenerateUnified).toHaveBeenCalledWith(
        expect.objectContaining({
          globalVariables: globalVars,
          scenarioVariables: scenarioVars,
        })
      );
    });

    it('should return traces, metrics, logs from generator result', async () => {
      mockGenerateUnified.mockResolvedValueOnce({
        traces: 100,
        metrics: 100,
        logs: 100,
        errors: [],
      });

      const result = await runUnified(baseOptions);

      expect(result).toEqual({
        traces: 100,
        metrics: 100,
        logs: 100,
        errors: [],
      });
    });

    it('should propagate errors from generator', async () => {
      mockGenerateUnified.mockResolvedValueOnce({
        traces: 50,
        metrics: 50,
        logs: 50,
        errors: ['Error 1', 'Error 2'],
      });

      const result = await runUnified(baseOptions);

      expect(result.errors).toEqual(['Error 1', 'Error 2']);
    });

    it('should use default rootSpan if not provided', async () => {
      await runUnified(baseOptions);

      expect(mockGenerateUnified).toHaveBeenCalledWith(
        expect.objectContaining({
          rootSpan: expect.objectContaining({
            name: expect.any(String),
            kind: expect.any(String),
          }),
        })
      );
    });

    it('should pass scenarioAttributes as fallback for attributes', async () => {
      const scenarioAttrs = { 'service.name': 'my-service', env: 'prod' };

      await runUnified({ ...baseOptions, scenarioAttributes: scenarioAttrs });

      expect(mockGenerateUnified).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: scenarioAttrs,
        })
      );
    });

    it('should prefer params.traceAttributes over scenarioAttributes', async () => {
      const params = {
        traceAttributes: { 'custom.attr': 'value' },
      };

      await runUnified({ ...baseOptions, params, scenarioAttributes: { 'other.attr': 'other' } });

      expect(mockGenerateUnified).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: { 'custom.attr': 'value' },
        })
      );
    });
  });
});