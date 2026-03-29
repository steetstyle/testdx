import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScenarioForm } from '../../pages/ScenarioBuilder/hooks/useScenarioForm';
import {
  TelemetryType,
  DistributionType,
  SpanKind,
  StatusCode,
  MetricType,
  MetricTemporality,
  AggregationType,
  MetricReaderType,
  RunMode,
} from '../../types';

describe('useScenarioForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('initializes with default form data', () => {
    const { result } = renderHook(() => useScenarioForm());

    expect(result.current.formData.name).toBe('');
    expect(result.current.formData.description).toBe('');
    expect(result.current.formData.telemetryType).toBe(TelemetryType.UNIFIED);
    expect(result.current.formData.includeTraces).toBe(true);
    expect(result.current.formData.includeMetrics).toBe(true);
    expect(result.current.formData.includeLogs).toBe(true);
    expect(result.current.formData.correlationEnabled).toBe(true);
    expect(result.current.formData.runMode).toBe(RunMode.REALTIME);
    expect(result.current.formData.schedule).toEqual({ enabled: false, cronExpression: '* * * * *' });
    expect(result.current.formData.variables).toEqual({});
    expect(result.current.formData.traceConfig.spans).toHaveLength(1);
    expect(result.current.formData.metricConfig.metrics).toHaveLength(1);
    expect(result.current.formData.logConfig.logs).toHaveLength(1);
  });

  it('updateFormData updates multiple fields', () => {
    const { result } = renderHook(() => useScenarioForm());

    act(() => {
      result.current.updateFormData({
        name: 'Test Scenario',
        description: 'A test scenario',
        telemetryType: TelemetryType.TRACES,
      });
    });

    expect(result.current.formData.name).toBe('Test Scenario');
    expect(result.current.formData.description).toBe('A test scenario');
    expect(result.current.formData.telemetryType).toBe(TelemetryType.TRACES);
  });

  it('updateDistribution updates distribution config', () => {
    const { result } = renderHook(() => useScenarioForm());

    act(() => {
      result.current.updateDistribution({
        type: DistributionType.GAUSSIAN,
        mean: 50,
        stdDev: 10,
      });
    });

    expect(result.current.formData.distribution.type).toBe(DistributionType.GAUSSIAN);
    expect(result.current.formData.distribution.mean).toBe(50);
    expect(result.current.formData.distribution.stdDev).toBe(10);
    expect(result.current.formData.distribution.rate).toBe(10);
  });

  it('updateTraceConfig updates trace config', () => {
    const { result } = renderHook(() => useScenarioForm());

    act(() => {
      result.current.updateTraceConfig({ samplingRatio: 0.5 });
    });

    expect(result.current.formData.traceConfig.samplingRatio).toBe(0.5);
    expect(result.current.formData.traceConfig.spans).toHaveLength(1);
  });

  it('updateMetricConfig updates metric config', () => {
    const { result } = renderHook(() => useScenarioForm());

    act(() => {
      result.current.updateMetricConfig({
        temporality: MetricTemporality.DELTA,
        aggregation: AggregationType.SUM,
      });
    });

    expect(result.current.formData.metricConfig.temporality).toBe(MetricTemporality.DELTA);
    expect(result.current.formData.metricConfig.aggregation).toBe(AggregationType.SUM);
  });

  it('updateLogConfig updates log config', () => {
    const { result } = renderHook(() => useScenarioForm());

    act(() => {
      result.current.updateLogConfig({
        includeTraceId: false,
        includeSpanId: false,
      });
    });

    expect(result.current.formData.logConfig.includeTraceId).toBe(false);
    expect(result.current.formData.logConfig.includeSpanId).toBe(false);
    expect(result.current.formData.logConfig.includeResourceAttributes).toBe(true);
  });

  it('updateSpans replaces all spans', () => {
    const { result } = renderHook(() => useScenarioForm());
    const newSpans = [
      { id: 'span-1', name: 'Span 1', kind: SpanKind.SERVER, statusCode: StatusCode.OK, attributes: {}, events: [], links: [], durationMs: 100 },
      { id: 'span-2', name: 'Span 2', kind: SpanKind.CLIENT, statusCode: StatusCode.OK, attributes: {}, events: [], links: [], durationMs: 50 },
    ];

    act(() => {
      result.current.updateSpans(newSpans);
    });

    expect(result.current.formData.traceConfig.spans).toEqual(newSpans);
    expect(result.current.formData.traceConfig.spans).toHaveLength(2);
  });

  it('addSpan adds a new span', () => {
    const { result } = renderHook(() => useScenarioForm());

    act(() => {
      result.current.addSpan();
    });

    expect(result.current.formData.traceConfig.spans).toHaveLength(2);

    act(() => {
      result.current.addSpan('span-123');
    });

    expect(result.current.formData.traceConfig.spans).toHaveLength(3);
    expect(result.current.formData.traceConfig.spans[2].parentSpanId).toBe('span-123');
  });

  it('addSpan creates span with correct default values', () => {
    const { result } = renderHook(() => useScenarioForm());

    act(() => {
      result.current.addSpan();
    });

    const newSpan = result.current.formData.traceConfig.spans[1];
    expect(newSpan.name).toBe('new-span');
    expect(newSpan.kind).toBe(SpanKind.INTERNAL);
    expect(newSpan.statusCode).toBe(StatusCode.OK);
    expect(newSpan.attributes).toEqual({});
    expect(newSpan.events).toEqual([]);
    expect(newSpan.links).toEqual([]);
    expect(newSpan.durationMs).toBe(50);
  });

  it('updateSpan updates specific span', () => {
    const { result } = renderHook(() => useScenarioForm());
    const spanId = result.current.formData.traceConfig.spans[0].id;

    act(() => {
      result.current.updateSpan(spanId, { name: 'Updated Span', durationMs: 200 });
    });

    expect(result.current.formData.traceConfig.spans[0].name).toBe('Updated Span');
    expect(result.current.formData.traceConfig.spans[0].durationMs).toBe(200);
  });

  it('updateSpan does not modify other spans', () => {
    const { result } = renderHook(() => useScenarioForm());

    act(() => {
      result.current.addSpan();
    });

    const spans = result.current.formData.traceConfig.spans;
    const spanId1 = spans[0].id;
    const spanId2 = spans[1].id;

    act(() => {
      result.current.updateSpan(spanId1, { name: 'Updated Span 1' });
    });

    expect(result.current.formData.traceConfig.spans[0].name).toBe('Updated Span 1');
    expect(result.current.formData.traceConfig.spans[1].name).toBe('new-span');
  });

  it('deleteSpan removes span', () => {
    const { result } = renderHook(() => useScenarioForm());
    const initialSpans = result.current.formData.traceConfig.spans;

    act(() => {
      result.current.addSpan();
    });
    expect(result.current.formData.traceConfig.spans).toHaveLength(2);

    act(() => {
      result.current.deleteSpan(initialSpans[0].id);
    });

    expect(result.current.formData.traceConfig.spans).toHaveLength(1);
    expect(result.current.formData.traceConfig.spans[0].name).toBe('new-span');
  });

  it('resetForm resets to initial state', () => {
    const { result } = renderHook(() => useScenarioForm());

    act(() => {
      result.current.updateFormData({
        name: 'Modified Name',
        description: 'Modified Description',
        telemetryType: TelemetryType.METRICS,
      });
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData.name).toBe('');
    expect(result.current.formData.description).toBe('');
    expect(result.current.formData.telemetryType).toBe(TelemetryType.UNIFIED);
  });

  it('setFormData replaces entire form data', () => {
    const { result } = renderHook(() => useScenarioForm());

    const newFormData = {
      ...result.current.formData,
      name: 'Complete Replacement',
      description: 'All new data',
      telemetryType: TelemetryType.LOGS,
    };

    act(() => {
      result.current.setFormData(newFormData);
    });

    expect(result.current.formData.name).toBe('Complete Replacement');
    expect(result.current.formData.telemetryType).toBe(TelemetryType.LOGS);
  });

  it('preserves existing distribution fields when updating', () => {
    const { result } = renderHook(() => useScenarioForm());

    act(() => {
      result.current.updateDistribution({ type: DistributionType.BURST, burstRate: 100 });
    });

    expect(result.current.formData.distribution.type).toBe(DistributionType.BURST);
    expect(result.current.formData.distribution.rate).toBe(10);
    expect(result.current.formData.distribution.burstRate).toBe(100);
  });

  it('returns all required methods', () => {
    const { result } = renderHook(() => useScenarioForm());

    expect(result.current).toHaveProperty('formData');
    expect(result.current).toHaveProperty('updateFormData');
    expect(result.current).toHaveProperty('updateDistribution');
    expect(result.current).toHaveProperty('updateTraceConfig');
    expect(result.current).toHaveProperty('updateMetricConfig');
    expect(result.current).toHaveProperty('updateLogConfig');
    expect(result.current).toHaveProperty('updateSpans');
    expect(result.current).toHaveProperty('addSpan');
    expect(result.current).toHaveProperty('updateSpan');
    expect(result.current).toHaveProperty('deleteSpan');
    expect(result.current).toHaveProperty('resetForm');
    expect(result.current).toHaveProperty('setFormData');
  });
});