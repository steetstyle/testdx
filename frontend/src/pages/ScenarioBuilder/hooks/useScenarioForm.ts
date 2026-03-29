import { useState, useCallback } from 'react';
import {
  TelemetryType,
  DistributionConfig,
  FixedConfig,
  SpanConfig,
  SpanKind,
  StatusCode,
  TraceScenarioConfig,
  MetricScenarioConfig,
  LogScenarioConfig,
  ScheduleConfig,
  MetricType,
  MetricTemporality,
  AggregationType,
  MetricReaderType,
  RunMode,
} from '../../../types';
import type { ScenarioVariables as ScenarioVariablesType } from '../../../services/variables/types';

export const defaultDistribution: DistributionConfig = {
  type: 'fixed',
  rate: 10,
} as FixedConfig;

export const defaultSpan: SpanConfig = {
  id: 'root-span',
  name: 'root-operation',
  kind: SpanKind.SERVER,
  statusCode: StatusCode.OK,
  attributes: {},
  events: [],
  links: [],
  durationMs: 100,
};

export const defaultTraceConfig: TraceScenarioConfig = {
  spans: [defaultSpan],
  samplingRatio: 1.0,
};

export const defaultMetricConfig: MetricScenarioConfig = {
  metrics: [{ name: 'requests', type: MetricType.COUNTER, value: 1, unit: '1', labels: {} }],
  metricAttributes: {},
  temporality: MetricTemporality.CUMULATIVE,
  aggregation: AggregationType.HISTOGRAM,
  readers: [MetricReaderType.PERIODIC],
};

export const defaultLogConfig: LogScenarioConfig = {
  logs: [{ severityNumber: 9, severityText: 'Info', body: 'Request processed', attributes: {} }],
  logAttributes: {},
  includeTraceId: true,
  includeSpanId: true,
  includeResourceAttributes: true,
  includeLogLevel: true,
  includeSystemAttributes: false,
};

export interface ScenarioFormData {
  name: string;
  description: string;
  telemetryType: TelemetryType;
  includeTraces: boolean;
  includeMetrics: boolean;
  includeLogs: boolean;
  correlationEnabled: boolean;
  traceConfig: TraceScenarioConfig;
  metricConfig: MetricScenarioConfig;
  logConfig: LogScenarioConfig;
  distribution: DistributionConfig;
  duration: number;
  schedule: ScheduleConfig;
  variables: ScenarioVariablesType;
  runMode: RunMode;
  timeRange?: {
    start: string;
    end: string;
  };
}

export interface UseScenarioFormReturn {
  formData: ScenarioFormData;
  updateFormData: (updates: Partial<ScenarioFormData>) => void;
  updateDistribution: (updates: DistributionConfig) => void;
  updateTraceConfig: (updates: Partial<TraceScenarioConfig>) => void;
  updateMetricConfig: (updates: Partial<MetricScenarioConfig>) => void;
  updateLogConfig: (updates: Partial<LogScenarioConfig>) => void;
  updateSpans: (spans: SpanConfig[]) => void;
  addSpan: (parentId?: string) => void;
  updateSpan: (spanId: string, updates: Partial<SpanConfig>) => void;
  deleteSpan: (spanId: string) => void;
  resetForm: () => void;
  setFormData: (data: ScenarioFormData) => void;
}

const initialFormData: ScenarioFormData = {
  name: '',
  description: '',
  telemetryType: TelemetryType.UNIFIED,
  includeTraces: true,
  includeMetrics: true,
  includeLogs: true,
  correlationEnabled: true,
  traceConfig: defaultTraceConfig,
  metricConfig: defaultMetricConfig,
  logConfig: defaultLogConfig,
  distribution: defaultDistribution,
  duration: 60,
  schedule: { enabled: false, cronExpression: '* * * * *' },
  variables: {},
  runMode: RunMode.REALTIME,
  timeRange: undefined,
};

export function useScenarioForm(): UseScenarioFormReturn {
  const [formData, setFormData] = useState<ScenarioFormData>(initialFormData);

  const updateFormData = useCallback((updates: Partial<ScenarioFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateDistribution = useCallback((updates: DistributionConfig) => {
    setFormData(prev => ({
      ...prev,
      distribution: updates,
    }));
  }, []);

  const updateTraceConfig = useCallback((updates: Partial<TraceScenarioConfig>) => {
    setFormData(prev => ({
      ...prev,
      traceConfig: { ...prev.traceConfig, ...updates },
    }));
  }, []);

  const updateMetricConfig = useCallback((updates: Partial<MetricScenarioConfig>) => {
    setFormData(prev => ({
      ...prev,
      metricConfig: { ...prev.metricConfig, ...updates },
    }));
  }, []);

  const updateLogConfig = useCallback((updates: Partial<LogScenarioConfig>) => {
    setFormData(prev => ({
      ...prev,
      logConfig: { ...prev.logConfig, ...updates },
    }));
  }, []);

  const updateSpans = useCallback((spans: SpanConfig[]) => {
    setFormData(prev => ({
      ...prev,
      traceConfig: { ...prev.traceConfig, spans },
    }));
  }, []);

  const addSpan = useCallback((parentId?: string) => {
    const newSpan: SpanConfig = {
      id: `span-${Date.now()}`,
      parentSpanId: parentId || undefined,
      name: 'new-span',
      kind: SpanKind.INTERNAL,
      statusCode: StatusCode.OK,
      attributes: {},
      events: [],
      links: [],
      durationMs: 50,
    };
    setFormData(prev => ({
      ...prev,
      traceConfig: {
        ...prev.traceConfig,
        spans: [...prev.traceConfig.spans, newSpan],
      },
    }));
  }, []);

  const updateSpan = useCallback((spanId: string, updates: Partial<SpanConfig>) => {
    setFormData(prev => ({
      ...prev,
      traceConfig: {
        ...prev.traceConfig,
        spans: prev.traceConfig.spans.map(s =>
          s.id === spanId ? { ...s, ...updates } : s
        ),
      },
    }));
  }, []);

  const deleteSpan = useCallback((spanId: string) => {
    setFormData(prev => ({
      ...prev,
      traceConfig: {
        ...prev.traceConfig,
        spans: prev.traceConfig.spans.filter(s => s.id !== spanId),
      },
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  return {
    formData,
    updateFormData,
    updateDistribution,
    updateTraceConfig,
    updateMetricConfig,
    updateLogConfig,
    updateSpans,
    addSpan,
    updateSpan,
    deleteSpan,
    resetForm,
    setFormData,
  };
}
