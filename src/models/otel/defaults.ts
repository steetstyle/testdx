import {
  OtelProtocol,
  CompressionType,
  SamplerType,
  SpanProcessorType,
  MetricTemporality,
  AggregationType,
  MetricReaderType,
  PropagatorType,
  LogLevel,
} from './enums';

import {
  OtelSdkConfig,
  OtelTraceConfig,
  OtelMetricConfig,
  OtelLogConfig,
  OtelResourceConfig,
  OtelPropagatorConfig,
  SpanLimitsConfig,
  MetricLimitsConfig,
} from './interfaces';

export const defaultSpanLimits: SpanLimitsConfig = {
  maxNumberOfAttributes: 1000,
  maxNumberOfAttributesPerSpan: 128,
  maxNumberOfEvents: 100,
  maxNumberOfLinks: 100,
  maxNumberOfAttributesPerEvent: 32,
  maxNumberOfAttributesPerLink: 32,
  maxAttributeValueLength: 4096,
};

export const defaultMetricLimits: MetricLimitsConfig = {
  maxNumberOfMetrics: 1000,
  maxNumberOfDataPointsPerMetric: 1000,
  maxNumberOfDataPointValuesPerMetric: 1000,
};

export const defaultOtelTraceConfig: OtelTraceConfig = {
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
  spanLimits: defaultSpanLimits,
  spanProcessor: SpanProcessorType.BATCH,
  exporters: [],
};

export const defaultOtelMetricConfig: OtelMetricConfig = {
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
  metricLimits: defaultMetricLimits,
  views: [],
  readers: [MetricReaderType.PERIODIC],
  exporters: [],
};

export const defaultOtelLogConfig: OtelLogConfig = {
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
};

export const defaultOtelResourceConfig: OtelResourceConfig = {
  serviceName: 'synthetic-service',
  attributes: {},
};

export const defaultOtelPropagatorConfig: OtelPropagatorConfig = {
  propagators: [PropagatorType.W3C],
};

export const defaultOtelSdkConfig: OtelSdkConfig = {
  sdkName: 'opentelemetry-js',
  sdkVersion: '1.0.0',
  logLevel: LogLevel.INFO,
  resource: defaultOtelResourceConfig,
  propagators: defaultOtelPropagatorConfig,
  trace: defaultOtelTraceConfig,
  metric: defaultOtelMetricConfig,
  log: defaultOtelLogConfig,
};