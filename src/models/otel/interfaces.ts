export interface SpanProcessorConfig {
  type: SpanProcessorType;
  batchConfig?: {
    maxQueueSize: number;
    maxExportBatchSize: number;
    exportTimeout: number;
    scheduledDelay: number;
  };
  simpleConfig?: {
    exportTimeout: number;
  };
}

export interface ExporterConfig {
  type: ExporterType;
  endpoint: string;
  protocol: OtelProtocol;
  timeout: number;
  compression: CompressionType;
  headers?: Record<string, string>;
  tlsConfig?: {
    insecure: boolean;
    caFile?: string;
    certFile?: string;
    keyFile?: string;
  };
}

export interface SpanLimitsConfig {
  maxNumberOfAttributes: number;
  maxNumberOfAttributesPerSpan: number;
  maxNumberOfEvents: number;
  maxNumberOfLinks: number;
  maxNumberOfAttributesPerEvent: number;
  maxNumberOfAttributesPerLink: number;
  maxAttributeValueLength: number;
}

export interface MetricLimitsConfig {
  maxNumberOfMetrics: number;
  maxNumberOfDataPointsPerMetric: number;
  maxNumberOfDataPointValuesPerMetric: number;
}

export interface ViewConfig {
  name: string;
  description?: string;
  unit?: string;
  attributeKeys?: string[];
  aggregation?: AggregationType;
  histogramBucketBoundaries?: number[];
}

export interface OtelTraceConfig {
  enabled: boolean;

  serviceName: string;
  instrumentationScopeName: string;
  instrumentationScopeVersion: string;

  protocol: OtelProtocol;
  endpoint: string;
  timeout: number;
  compression: CompressionType;

  resourceAttributes: Record<string, string>;

  samplerType: SamplerType;
  samplerParam: number;

  spanLimits: SpanLimitsConfig;
  spanProcessor: SpanProcessorType;
  batchConfig?: {
    maxQueueSize: number;
    maxExportBatchSize: number;
    exportTimeout: number;
    scheduledDelay: number;
  };
  simpleConfig?: {
    exportTimeout: number;
  };

  exporters: ExporterConfig[];
}

export interface OtelMetricConfig {
  enabled: boolean;

  serviceName: string;
  instrumentationScopeName: string;
  instrumentationScopeVersion: string;

  protocol: OtelProtocol;
  endpoint: string;
  timeout: number;
  compression: CompressionType;

  resourceAttributes: Record<string, string>;
  metricAttributes: Record<string, string>;

  temporality: MetricTemporality;
  aggregation: AggregationType;

  metricLimits: MetricLimitsConfig;

  views: ViewConfig[];
  readers: MetricReaderType[];

  exporters: ExporterConfig[];
}

export interface OtelLogConfig {
  enabled: boolean;

  serviceName: string;
  instrumentationScopeName: string;
  instrumentationScopeVersion: string;

  protocol: OtelProtocol;
  endpoint: string;
  timeout: number;
  compression: CompressionType;

  includeTraceId: boolean;
  includeSpanId: boolean;
  includeResourceAttributes: boolean;
  includeLogLevel: boolean;
  includeSystemAttributes: boolean;

  resourceAttributes: Record<string, string>;
  logAttributes: Record<string, string>;

  maxNumberOfAttributes: number;
  maxNumberOfAttributesPerLogRecord: number;
  maxNumberOfLogRecords: number;

  exporters: ExporterConfig[];
}

export interface OtelPropagatorConfig {
  propagators: PropagatorType[];
  baggageKeys?: string[];
}

export interface OtelResourceConfig {
  serviceName: string;
  serviceNamespace?: string;
  serviceInstanceId?: string;
  serviceVersion?: string;
  deploymentEnvironment?: string;
  attributes: Record<string, string>;
}

export interface OtelSdkConfig {
  sdkName: string;
  sdkVersion: string;

  logLevel: LogLevel;

  resource: OtelResourceConfig;
  propagators: OtelPropagatorConfig;

  trace: OtelTraceConfig;
  metric: OtelMetricConfig;
  log: OtelLogConfig;
}

import { SpanProcessorType, ExporterType, OtelProtocol, CompressionType, SamplerType, MetricTemporality, AggregationType, MetricReaderType, PropagatorType, LogLevel } from './enums';