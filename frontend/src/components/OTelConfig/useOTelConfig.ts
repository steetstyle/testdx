import { useState, useEffect, useCallback } from 'react';
import type { OtelSdkConfig } from '../../types';
import {
  LogLevel,
  PropagatorType,
  OtelProtocol,
  CompressionType,
  SamplerType,
  SpanProcessorType,
  MetricTemporality,
  AggregationType,
  MetricReaderType,
} from '../../types';

export const defaultOTelConfig: OtelSdkConfig = {
  sdkName: 'opentelemetry-js',
  sdkVersion: '1.0.0',
  logLevel: LogLevel.INFO,
  resource: {
    serviceName: 'synthetic-service',
    serviceNamespace: '',
    serviceInstanceId: '',
    serviceVersion: '',
    deploymentEnvironment: '',
    attributes: {},
  },
  propagators: {
    propagators: [PropagatorType.W3C],
    baggageKeys: [],
  },
  trace: {
    enabled: true,
    serviceName: 'synthetic-service',
    instrumentationScopeName: 'testdx',
    instrumentationScopeVersion: '1.0.0',
    protocol: OtelProtocol.HTTP,
    endpoint: 'http://localhost:4318',
    timeout: 30000,
    compression: CompressionType.GZIP,
    resourceAttributes: {},
    samplerType: SamplerType.PARENT_BASED_TRACE_ID,
    samplerParam: 1.0,
    spanLimits: {
      maxNumberOfAttributes: 1000,
      maxNumberOfAttributesPerSpan: 128,
      maxNumberOfEvents: 100,
      maxNumberOfLinks: 100,
      maxNumberOfAttributesPerEvent: 32,
      maxNumberOfAttributesPerLink: 32,
      maxAttributeValueLength: 4096,
    },
    spanProcessor: SpanProcessorType.BATCH,
    batchConfig: {
      maxQueueSize: 2048,
      maxExportBatchSize: 512,
      exportTimeout: 30000,
      scheduledDelay: 5000,
    },
    simpleConfig: {
      exportTimeout: 30000,
    },
    exporters: [],
  },
  metric: {
    enabled: true,
    serviceName: 'synthetic-service',
    instrumentationScopeName: 'testdx',
    instrumentationScopeVersion: '1.0.0',
    protocol: OtelProtocol.HTTP,
    endpoint: 'http://localhost:4318',
    timeout: 30000,
    compression: CompressionType.GZIP,
    resourceAttributes: {},
    metricAttributes: {},
    temporality: MetricTemporality.CUMULATIVE,
    aggregation: AggregationType.HISTOGRAM,
    metricLimits: {
      maxNumberOfMetrics: 1000,
      maxNumberOfDataPointsPerMetric: 1000,
      maxNumberOfDataPointValuesPerMetric: 1000,
    },
    views: [],
    readers: [MetricReaderType.PERIODIC],
    exporters: [],
  },
  log: {
    enabled: true,
    serviceName: 'synthetic-service',
    instrumentationScopeName: 'testdx',
    instrumentationScopeVersion: '1.0.0',
    protocol: OtelProtocol.HTTP,
    endpoint: 'http://localhost:4318',
    timeout: 30000,
    compression: CompressionType.GZIP,
    includeTraceId: true,
    includeSpanId: true,
    includeResourceAttributes: true,
    includeLogLevel: true,
    includeSystemAttributes: false,
    resourceAttributes: {},
    logAttributes: {},
    maxNumberOfAttributes: 100,
    maxNumberOfAttributesPerLogRecord: 32,
    maxNumberOfLogRecords: 1000,
    exporters: [],
  },
};

interface UseOTelConfigReturn {
  config: OtelSdkConfig;
  updateConfig: (path: string, val: unknown) => void;
  updateNested: (section: string, field: string, val: unknown) => void;
  setConfig: (config: OtelSdkConfig) => void;
}

export function useOTelConfig(value: OtelSdkConfig): UseOTelConfigReturn {
  const [config, setConfigState] = useState<OtelSdkConfig>(value || defaultOTelConfig);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid pattern for syncing external prop to internal state
  useEffect(() => {
    if (value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Controlled component pattern
      setConfigState(value);
    }
  }, [value]);

  const setConfig = useCallback((newConfig: OtelSdkConfig) => {
    setConfigState(newConfig);
  }, []);

  const updateConfig = useCallback((path: string, val: unknown) => {
    const newConfig = { ...config };
    const parts = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let obj: any = newConfig;
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = val;
    setConfigState(newConfig);
  }, [config]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateNested = useCallback((section: string, field: string, val: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentSection = config[section as keyof typeof config] as any;
    const existingField = currentSection?.[field];
    const mergedField = (typeof existingField === 'object' && typeof val === 'object')
      ? { ...existingField, ...val }
      : val;
    const newConfig = {
      ...config,
      [section]: { ...currentSection, [field]: mergedField },
    };
    setConfigState(newConfig);
  }, [config]);

  return {
    config,
    updateConfig,
    updateNested,
    setConfig,
  };
}