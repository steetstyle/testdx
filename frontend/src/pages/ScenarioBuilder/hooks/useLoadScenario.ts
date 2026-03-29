import { useState, useCallback } from 'react';
import { syntheticApi } from '../../../services/api';
import { RunMode, DistributionConfig } from '../../../types';
import type { OtelSdkConfig, SpanKind, StatusCode } from '../../../types';
import type { GlobalVariables, ScenarioVariables } from '../../../services/variables/types';
import {
  defaultTraceConfig,
  defaultMetricConfig,
  defaultLogConfig,
  defaultDistribution,
  type ScenarioFormData,
} from './useScenarioForm';

function normalizeDistribution(dist: any): DistributionConfig {
  if (!dist) return defaultDistribution;
  
  const defaults: Record<string, any> = {
    fixed: { rate: 10 },
    uniform: { min: 1, max: 10 },
    gaussian: { mean: 10, stdDev: 2 },
    linearRamp: { start: 5, end: 20, duration: 1 },
    exponentialRamp: { start: 5, growth: 1.1, duration: 1 },
    sine: { base: 10, amplitude: 5, period: 10, phase: 0 },
    square: { min: 5, max: 20, period: 10 },
    triangle: { min: 5, max: 20, period: 10 },
    burst: { baseRate: 5, burstRate: 50, probability: 0.1 },
    poisson: { lambda: 10 },
    exponential: { lambda: 1 },
  };
  
  const type = dist.type || 'fixed';
  return {
    type,
    ...(defaults[type] || {}),
    ...dist,
  };
}

export interface UseLoadScenarioReturn {
  loadScenario: (id: string) => Promise<ScenarioFormData>;
  loadService: (id: string) => Promise<void>;
  projectVariables: GlobalVariables;
  serviceVariables: GlobalVariables;
  serviceConfig: OtelSdkConfig | null;
}

export function useLoadScenario(): UseLoadScenarioReturn {
  const [projectVariables, setProjectVariables] = useState<GlobalVariables>({});
  const [serviceVariables, setServiceVariables] = useState<GlobalVariables>({});
  const [serviceConfig, setServiceConfig] = useState<OtelSdkConfig | null>(null);

  const loadScenario = useCallback(async (scenarioId: string): Promise<ScenarioFormData> => {
    const scenario = await syntheticApi.getScenario(scenarioId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = scenario.params as any;

    const loadedTraceConfig = params?.rootSpan ? {
      spans: [{
        id: params.rootSpan.id || 'root-span',
        name: params.rootSpan.name || 'root-operation',
        kind: (params.rootSpan.kind || 'server') as SpanKind,
        statusCode: (params.rootSpan.statusCode || 'Ok') as StatusCode,
        attributes: params.rootSpan.attributes || {},
        events: params.rootSpan.events || [],
        links: params.rootSpan.links || [],
        durationMs: params.rootSpan.durationMs || 100,
      }],
      samplingRatio: 1.0,
    } : defaultTraceConfig;

    const loadedMetricConfig = params?.metrics ? {
      metrics: params.metrics || [],
      metricAttributes: params.metricAttributes || {},
      temporality: params.temporality || 'cumulative',
      aggregation: params.aggregation || 'histogram',
      readers: params.readers || ['periodic'],
    } : defaultMetricConfig;

    const loadedLogConfig = params?.logs ? {
      logs: params.logs || [],
      logAttributes: params.logAttributes || {},
      includeTraceId: true,
      includeSpanId: true,
      includeResourceAttributes: true,
      includeLogLevel: true,
      includeSystemAttributes: false,
    } : defaultLogConfig;

    const formData: ScenarioFormData = {
      name: scenario.name,
      description: scenario.description,
      telemetryType: scenario.telemetryType,
      includeTraces: params?.includeTraces ?? true,
      includeMetrics: params?.includeMetrics ?? true,
      includeLogs: params?.includeLogs ?? true,
      correlationEnabled: params?.correlationEnabled ?? true,
      traceConfig: loadedTraceConfig,
      metricConfig: loadedMetricConfig,
      logConfig: loadedLogConfig,
      distribution: normalizeDistribution(scenario.distribution),
      duration: (scenario.distribution as any)?.duration ?? 60,
      schedule: scenario.schedule || { enabled: false },
      variables: (scenario.variables || {}) as ScenarioVariables,
      runMode: RunMode.REALTIME,
      timeRange: undefined,
    };

    if (scenario.projectVariables) {
      setProjectVariables(scenario.projectVariables);
    }
    if (scenario.serviceVariables) {
      setServiceVariables(scenario.serviceVariables);
    }

    return formData;
  }, []);

  const loadService = useCallback(async (serviceId: string): Promise<void> => {
    const service = await syntheticApi.getService(serviceId);
    if (service?.otelSdkConfig) {
      setServiceConfig(service.otelSdkConfig);
    }
    if (service?.serviceVariables) {
      setServiceVariables(service.serviceVariables);
    }
    if (service?.project?.projectVariables) {
      setProjectVariables(service.project.projectVariables);
    }
  }, []);

  return {
    loadScenario,
    loadService,
    projectVariables,
    serviceVariables,
    serviceConfig,
  };
}
