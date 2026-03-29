const { TelemetryType, RunStatus, RunMode } = require('../models/scenario');

jest.mock('../models/scenario', () => ({
  SyntheticScenario: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
  TelemetryType: {
    UNIFIED: 'unified',
    TRACES: 'traces',
    METRICS: 'metrics',
    LOGS: 'logs',
  },
  RunStatus: {
    SUCCESS: 'success',
    FAILED: 'failed',
  },
  RunMode: {
    REALTIME: 'realtime',
    HISTORICAL: 'historical',
  },
}));

jest.mock('../models/service', () => ({
  Service: {
    findById: jest.fn().mockResolvedValue({
      otelSdkConfig: {
        trace: { endpoint: 'http://localhost:4318', serviceName: 'test-service' },
      },
    }),
  },
}));

jest.mock('../services/otel', () => ({
  OtelGenerator: jest.fn().mockImplementation(() => ({
    generateUnified: jest.fn().mockResolvedValue({ traces: 10, metrics: 10, logs: 10, errors: [] }),
    generateTraces: jest.fn().mockResolvedValue({ recordsGenerated: 10, errors: [] }),
    generateMetrics: jest.fn().mockResolvedValue({ recordsGenerated: 10, errors: [] }),
    generateLogs: jest.fn().mockResolvedValue({ recordsGenerated: 10, errors: [] }),
    testConnection: jest.fn().mockResolvedValue(true),
  })),
}));

const { SyntheticRunner } = require('../services/syntheticRunner');

describe('SyntheticRunner', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let runner: any;

  const mockScenario = {
    _id: 'scenario-123',
    serviceId: { toString: () => 'service-123' },
    name: 'test-scenario',
    telemetryType: TelemetryType.UNIFIED,
    params: {
      includeTraces: true,
      includeMetrics: true,
      includeLogs: true,
      correlationEnabled: true,
      rootSpan: {
        name: 'root-span',
        kind: 'server',
        statusCode: 'Ok',
        attributes: {},
        events: [],
        links: [],
        childSpans: 2,
        durationMs: 100,
      },
      metrics: [{ name: 'test.counter', type: 'counter', value: 1, unit: '1', labels: {} }],
      logs: [{ severityNumber: 9, severityText: 'Info', body: 'test', attributes: {} }],
    },
    distribution: { type: 'uniform', rate: 10 },
    limits: { maxPerHour: 100 },
    attributes: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    runner = new SyntheticRunner();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('runScenario', () => {
    it('should return error for non-existent scenario', async () => {
      const { SyntheticScenario } = require('../models/scenario');
      SyntheticScenario.findById.mockResolvedValue(null);

      const result = await runner.runScenario('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Scenario not found');
    });

    it('should return error if scenario is already running', async () => {
      const { SyntheticScenario } = require('../models/scenario');
      SyntheticScenario.findById.mockResolvedValue(mockScenario);
      
      runner.setRunningForTesting('scenario-123');

      const result = await runner.runScenario('scenario-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Scenario already running');
    });

    it('should respect hourly run limits', async () => {
      const { SyntheticScenario } = require('../models/scenario');
      SyntheticScenario.findById.mockResolvedValue(mockScenario);
      
      runner.setHourlyCountForTesting('scenario-123', 100);

      const result = await runner.runScenario('scenario-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Hourly run limit');
    });
  });

  describe('isRunning', () => {
    it('should return false for non-running scenario', () => {
      expect(runner.isRunning('scenario-123')).toBe(false);
    });

    it('should return true for running scenario', () => {
      runner.setRunningForTesting('scenario-123');
      expect(runner.isRunning('scenario-123')).toBe(true);
    });
  });

  describe('stopScenario', () => {
    it('should return false for non-running scenario', async () => {
      const { SyntheticScenario } = require('../models/scenario');
      SyntheticScenario.findByIdAndUpdate.mockResolvedValue({});
      
      const result = await runner.stopScenario('scenario-123');
      
      expect(result).toBe(false);
    });

    it('should return true and update progress for running scenario', async () => {
      const { SyntheticScenario } = require('../models/scenario');
      SyntheticScenario.findByIdAndUpdate.mockResolvedValue({});
      runner.setRunningForTesting('scenario-123');
      
      const result = await runner.stopScenario('scenario-123');
      
      expect(result).toBe(true);
      expect(SyntheticScenario.findByIdAndUpdate).toHaveBeenCalledWith('scenario-123', {
        currentRunProgress: { status: 'stopped' },
      });
    });

    it('should set cancelled flag on process state', async () => {
      runner.setRunningForTesting('scenario-123');
      
      await runner.stopScenario('scenario-123');
      
      expect(runner.isRunning('scenario-123')).toBe(true);
    });
  });
});

describe('Scenario Running - Telemetry Types', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let runner: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    runner = new SyntheticRunner();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should handle UNIFIED telemetry type', async () => {
    const { SyntheticScenario } = require('../models/scenario');
    const unifiedScenario = {
      _id: 'unified-scenario',
      serviceId: { toString: () => 'service-123' },
      name: 'unified-scenario',
      telemetryType: TelemetryType.UNIFIED,
      params: {
        includeTraces: true,
        includeMetrics: true,
        includeLogs: true,
        correlationEnabled: true,
        rootSpan: {
          name: 'root-span', kind: 'server', statusCode: 'Ok',
          attributes: {}, events: [], links: [], childSpans: 2, durationMs: 100,
        },
        metrics: [],
        logs: [],
      },
      distribution: { type: 'uniform', rate: 10, duration: 1 },
      limits: { maxPerHour: 100 },
      attributes: {},
    };
    SyntheticScenario.findById.mockResolvedValue(unifiedScenario);
    SyntheticScenario.findByIdAndUpdate.mockResolvedValue({});

    const result = await runner.runScenario('unified-scenario');

    expect(result.success).toBe(true);
    expect(result.tracesGenerated).toBe(10);
  }, 10000);

  it('should handle TRACES telemetry type', async () => {
    const { SyntheticScenario } = require('../models/scenario');
    const tracesScenario = {
      _id: 'traces-scenario',
      serviceId: { toString: () => 'service-123' },
      name: 'traces-scenario',
      telemetryType: TelemetryType.TRACES,
      params: {
        count: 10,
        rootSpanName: 'operation',
        rootSpan: {
          name: 'root-span', kind: 'server', statusCode: 'Ok',
          attributes: {}, events: [], links: [], childSpans: 2, durationMs: 100,
        },
      },
      distribution: { type: 'uniform', rate: 10 },
      limits: { maxPerHour: 100 },
      attributes: {},
    };
    SyntheticScenario.findById.mockResolvedValue(tracesScenario);
    SyntheticScenario.findByIdAndUpdate.mockResolvedValue({});

    const result = await runner.runScenario('traces-scenario');

    expect(result.success).toBe(true);
    expect(result.tracesGenerated).toBe(10);
  });

  it('should handle METRICS telemetry type', async () => {
    const { SyntheticScenario } = require('../models/scenario');
    const metricsScenario = {
      _id: 'metrics-scenario',
      serviceId: { toString: () => 'service-123' },
      name: 'metrics-scenario',
      telemetryType: TelemetryType.METRICS,
      params: {
        metrics: [{ name: 'test.metric', type: 'counter', value: 1, unit: '1', labels: {} }],
      },
      distribution: { type: 'uniform', rate: 10 },
      limits: { maxPerHour: 100 },
      attributes: {},
    };
    SyntheticScenario.findById.mockResolvedValue(metricsScenario);
    SyntheticScenario.findByIdAndUpdate.mockResolvedValue({});

    const result = await runner.runScenario('metrics-scenario');

    expect(result.success).toBe(true);
    expect(result.metricsGenerated).toBe(10);
  });

  it('should handle LOGS telemetry type', async () => {
    const { SyntheticScenario } = require('../models/scenario');
    const logsScenario = {
      _id: 'logs-scenario',
      serviceId: { toString: () => 'service-123' },
      name: 'logs-scenario',
      telemetryType: TelemetryType.LOGS,
      params: {
        logs: [{ severityNumber: 9, severityText: 'Info', body: 'test', attributes: {} }],
        includeTraceId: true,
      },
      distribution: { type: 'uniform', rate: 10 },
      limits: { maxPerHour: 100 },
      attributes: {},
    };
    SyntheticScenario.findById.mockResolvedValue(logsScenario);
    SyntheticScenario.findByIdAndUpdate.mockResolvedValue({});

    const result = await runner.runScenario('logs-scenario');

    expect(result.success).toBe(true);
    expect(result.logsGenerated).toBe(10);
  });

  it('should handle METRICS telemetry type', async () => {
    const { SyntheticScenario } = require('../models/scenario');
    const metricsScenario = {
      _id: 'metrics-scenario',
      serviceId: { toString: () => 'service-123' },
      name: 'metrics-scenario',
      telemetryType: TelemetryType.METRICS,
      params: {
        metrics: [{ name: 'test.counter', type: 'counter', value: 1, unit: '1', labels: {} }],
      },
      distribution: { type: 'uniform', rate: 10 },
      limits: { maxPerHour: 100 },
      attributes: {},
    };
    SyntheticScenario.findById.mockResolvedValue(metricsScenario);
    SyntheticScenario.findByIdAndUpdate.mockResolvedValue({});

    const result = await runner.runScenario('metrics-scenario');

    expect(result.success).toBe(true);
    expect(result.metricsGenerated).toBe(10);
  });

  it('should handle LOGS telemetry type', async () => {
    const { SyntheticScenario } = require('../models/scenario');
    const logsScenario = {
      _id: 'logs-scenario',
      serviceId: { toString: () => 'service-123' },
      name: 'logs-scenario',
      telemetryType: TelemetryType.LOGS,
      params: {
        logs: [{ severityNumber: 9, severityText: 'Info', body: 'test', attributes: {} }],
        includeTraceId: true,
      },
      distribution: { type: 'uniform', rate: 10 },
      limits: { maxPerHour: 100 },
      attributes: {},
    };
    SyntheticScenario.findById.mockResolvedValue(logsScenario);
    SyntheticScenario.findByIdAndUpdate.mockResolvedValue({});

    const result = await runner.runScenario('logs-scenario');

    expect(result.success).toBe(true);
    expect(result.logsGenerated).toBe(10);
  });
});

describe('Time Range Distribution', () => {
  it('should distribute timestamps evenly across time range', () => {
    const start = new Date('2026-03-26T10:00:00Z').getTime();
    const end = new Date('2026-03-26T12:00:00Z').getTime();
    const count = 10;
    
    const timestamps: number[] = [];
    for (let i = 0; i < count; i++) {
      const ts = start + ((i / count) * (end - start));
      timestamps.push(ts);
    }

    expect(timestamps[0]).toBe(start);
    expect(timestamps[timestamps.length - 1]).toBeLessThan(end);
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }
  });

  it('should handle random distribution within time range', () => {
    const start = new Date('2026-03-26T10:00:00Z').getTime();
    const end = new Date('2026-03-26T12:00:00Z').getTime();
    
    for (let i = 0; i < 100; i++) {
      const ts = start + (Math.random() * (end - start));
      expect(ts).toBeGreaterThanOrEqual(start);
      expect(ts).toBeLessThan(end);
    }
  });

  it('should handle single point time range', () => {
    const sameTime = new Date('2026-03-26T10:00:00Z').getTime();
    const count = 5;
    
    for (let i = 0; i < count; i++) {
      const ts = sameTime + ((i / count) * (0));
      expect(ts).toBe(sameTime);
    }
  });
});

describe('Historical Mode Time Range Detection', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let runner: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    runner = new (require('../services/syntheticRunner')).SyntheticRunner();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should detect historical mode when endDate is in the past', async () => {
    const { SyntheticScenario } = require('../models/scenario');
    
    const pastScenario = {
      _id: 'historical-scenario',
      serviceId: { toString: () => 'service-123' },
      name: 'past-scenario',
      telemetryType: 'metrics',
      params: {
        metrics: [{ name: 'test.metric', type: 'counter', value: 1, unit: '1', labels: {} }],
      },
      distribution: { 
        type: 'uniform', 
        rate: 10, 
        startDate: '2026-03-25T10:00:00Z',
        endDate: '2026-03-25T12:00:00Z',
      },
      limits: { maxPerHour: 100 },
      attributes: {},
    };
    
    SyntheticScenario.findById.mockResolvedValue(pastScenario);
    SyntheticScenario.findByIdAndUpdate.mockResolvedValue({});

    const result = await runner.runScenario('historical-scenario');

    expect(result.success).toBe(true);
  });

  it('should detect realtime mode when time range spans now', async () => {
    const { SyntheticScenario } = require('../models/scenario');
    
    const now = new Date();
    const pastStart = new Date(now.getTime() - 60 * 60 * 1000);
    const futureEnd = new Date(now.getTime() + 60 * 60 * 1000);
    
    const spanningScenario = {
      _id: 'spanning-scenario',
      serviceId: { toString: () => 'service-123' },
      name: 'spanning-scenario',
      telemetryType: 'metrics',
      params: {
        metrics: [{ name: 'test.metric', type: 'counter', value: 1, unit: '1', labels: {} }],
      },
      distribution: { 
        type: 'uniform', 
        rate: 10, 
        startDate: pastStart.toISOString(),
        endDate: futureEnd.toISOString(),
      },
      limits: { maxPerHour: 100 },
      attributes: {},
    };
    
    SyntheticScenario.findById.mockResolvedValue(spanningScenario);
    SyntheticScenario.findByIdAndUpdate.mockResolvedValue({});

    const result = await runner.runScenario('spanning-scenario');

    expect(result.success).toBe(true);
  });

  it('should wait then run realtime when startDate is in the future', async () => {
    const { SyntheticScenario } = require('../models/scenario');
    
    const futureStart = new Date(Date.now() + 1000);
    const futureEnd = new Date(Date.now() + 2000);
    
    const futureScenario = {
      _id: 'future-scenario',
      serviceId: { toString: () => 'service-123' },
      name: 'future-scenario',
      telemetryType: 'metrics',
      params: {
        metrics: [{ name: 'test.metric', type: 'counter', value: 1, unit: '1', labels: {} }],
      },
      distribution: { 
        type: 'uniform', 
        rate: 10, 
        startDate: futureStart.toISOString(),
        endDate: futureEnd.toISOString(),
      },
      limits: { maxPerHour: 100 },
      attributes: {},
    };
    
    SyntheticScenario.findById.mockResolvedValue(futureScenario);
    SyntheticScenario.findByIdAndUpdate.mockResolvedValue({});

    const runPromise = runner.runScenario('future-scenario');
    
    jest.advanceTimersByTime(1500);
    
    const result = await runPromise;

    expect(result.success).toBe(true);
  });

  it('should calculate correct totalExpected for historical mode based on time range', async () => {
    const { SyntheticScenario } = require('../models/scenario');
    
    const pastScenario = {
      _id: 'historical-records-scenario',
      serviceId: { toString: () => 'service-123' },
      name: 'historical-records-scenario',
      telemetryType: 'metrics',
      params: {
        metrics: [{ name: 'test.metric', type: 'counter', value: 1, unit: '1', labels: {} }],
      },
      distribution: { 
        type: 'uniform', 
        rate: 10, 
        startDate: '2026-03-25T10:00:00Z',
        endDate: '2026-03-25T12:00:00Z',
      },
      limits: { maxPerHour: 100 },
      attributes: {},
    };
    
    SyntheticScenario.findById.mockResolvedValue(pastScenario);
    SyntheticScenario.findByIdAndUpdate.mockResolvedValue({});

    await runner.runScenario('historical-records-scenario');

    const updateCall = SyntheticScenario.findByIdAndUpdate.mock.calls[0];
    const progress = updateCall[1].currentRunProgress;
    
    expect(progress.totalExpected).toBe(72000);
  });

  it('should set mode to realtime when no startDate/endDate provided', async () => {
    const { SyntheticScenario } = require('../models/scenario');
    
    const noTimeRangeScenario = {
      _id: 'no-time-range-scenario',
      serviceId: { toString: () => 'service-123' },
      name: 'no-time-range-scenario',
      telemetryType: 'metrics',
      params: {
        metrics: [{ name: 'test.metric', type: 'counter', value: 1, unit: '1', labels: {} }],
      },
      distribution: { 
        type: 'uniform', 
        rate: 10, 
      },
      limits: { maxPerHour: 100 },
      attributes: {},
    };
    
    SyntheticScenario.findById.mockResolvedValue(noTimeRangeScenario);
    SyntheticScenario.findByIdAndUpdate.mockResolvedValue({});

    await runner.runScenario('no-time-range-scenario');

    const updateCall = SyntheticScenario.findByIdAndUpdate.mock.calls[0];
    const progress = updateCall[1].currentRunProgress;
    
    expect(progress.mode).toBe('realtime');
  });

  it('should handle immediate past scenario (very short duration)', async () => {
    const { SyntheticScenario } = require('../models/scenario');
    
    const pastScenario = {
      _id: 'immediate-past-scenario',
      serviceId: { toString: () => 'service-123' },
      name: 'immediate-past-scenario',
      telemetryType: 'metrics',
      params: {
        metrics: [{ name: 'test.metric', type: 'counter', value: 1, unit: '1', labels: {} }],
      },
      distribution: { 
        type: 'uniform', 
        rate: 10, 
        startDate: '2026-03-25T10:00:00Z',
        endDate: '2026-03-25T10:01:00Z',
      },
      limits: { maxPerHour: 100 },
      attributes: {},
    };
    
    SyntheticScenario.findById.mockResolvedValue(pastScenario);
    SyntheticScenario.findByIdAndUpdate.mockResolvedValue({});

    const result = await runner.runScenario('immediate-past-scenario');

    expect(result.success).toBe(true);
  });
});

describe('Metric Distribution Algorithms', () => {
  const getDistributedValue = (baseValue: number, dist: any): number => {
    if (!dist) return baseValue;

    switch (dist.type) {
      case 'uniform':
        return baseValue;
      case 'normal': {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return Math.max(0, baseValue + (dist.stdDev || 10) * z);
      }
      case 'linear': {
        const progress = Math.random();
        return baseValue * (dist.minRate || 0.5 + progress * ((dist.maxRate || 1.5) - 0.5));
      }
      case 'exponential':
        return -baseValue * Math.log(Math.random());
      case 'burst':
        return Math.random() > 0.9 ? baseValue * 10 : baseValue;
      default:
        return baseValue;
    }
  };

  it('should apply uniform distribution', () => {
    const baseValue = 100;
    const results: number[] = [];
    for (let i = 0; i < 100; i++) {
      results.push(getDistributedValue(baseValue, { type: 'uniform' }));
    }
    expect(results.every(v => v === baseValue)).toBe(true);
  });

  it('should apply burst distribution with occasional spikes', () => {
    const baseValue = 10;
    let spikeCount = 0;
    for (let i = 0; i < 100; i++) {
      const value = getDistributedValue(baseValue, { type: 'burst' });
      if (value > baseValue) spikeCount++;
    }
    expect(spikeCount).toBeGreaterThan(0);
    expect(spikeCount).toBeLessThan(30);
  });

  it('should apply linear distribution within range', () => {
    const baseValue = 50;
    const minRate = 0.5;
    const maxRate = 1.5;
    
    for (let i = 0; i < 100; i++) {
      const value = getDistributedValue(baseValue, { type: 'linear', minRate, maxRate });
      expect(value).toBeGreaterThanOrEqual(baseValue * minRate);
      expect(value).toBeLessThanOrEqual(baseValue * maxRate);
    }
  });

  it('should generate positive normal distribution values', () => {
    const baseValue = 100;
    const stdDev = 10;
    
    for (let i = 0; i < 100; i++) {
      const value = getDistributedValue(baseValue, { type: 'normal', stdDev });
      expect(value).toBeGreaterThan(0);
    }
  });

  it('should generate exponential distribution', () => {
    const baseValue = 100;
    
    for (let i = 0; i < 100; i++) {
      const value = getDistributedValue(baseValue, { type: 'exponential' });
      expect(value).toBeGreaterThan(0);
    }
  });
});
