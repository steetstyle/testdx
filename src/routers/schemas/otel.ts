import { z } from 'zod';
import {
  PropagatorTypeSchema,
  CompressionTypeSchema,
  SamplerTypeSchema,
  ExporterTypeSchema,
  SpanProcessorTypeSchema,
  MetricTemporalitySchema,
  AggregationTypeSchema,
  MetricReaderTypeSchema,
} from './base';

export const TlsConfigSchema = z.object({
  insecure: z.boolean().default(true),
  caFile: z.string().optional(),
  certFile: z.string().optional(),
  keyFile: z.string().optional(),
}).optional();

export const ExporterConfigSchema = z.object({
  type: ExporterTypeSchema,
  endpoint: z.string(),
  protocol: z.enum(['grpc', 'http', 'http/json']).default('http'),
  timeout: z.number().default(30000),
  compression: CompressionTypeSchema.default('gzip'),
  headers: z.record(z.string()).optional(),
  tlsConfig: TlsConfigSchema,
});

export const SpanLimitsConfigSchema = z.object({
  maxNumberOfAttributes: z.number().default(1000),
  maxNumberOfAttributesPerSpan: z.number().default(128),
  maxNumberOfEvents: z.number().default(100),
  maxNumberOfLinks: z.number().default(100),
  maxNumberOfAttributesPerEvent: z.number().default(32),
  maxNumberOfAttributesPerLink: z.number().default(32),
  maxAttributeValueLength: z.number().default(4096),
});

export const MetricLimitsConfigSchema = z.object({
  maxNumberOfMetrics: z.number().default(1000),
  maxNumberOfDataPointsPerMetric: z.number().default(1000),
  maxNumberOfDataPointValuesPerMetric: z.number().default(1000),
});

export const ViewConfigSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  unit: z.string().optional(),
  attributeKeys: z.array(z.string()).default([]),
  aggregation: AggregationTypeSchema.optional(),
  histogramBucketBoundaries: z.array(z.number()).default([]),
});

export const SpanProcessorConfigSchema = z.object({
  type: SpanProcessorTypeSchema,
  batchConfig: z.object({
    maxQueueSize: z.number().default(2048),
    maxExportBatchSize: z.number().default(512),
    exportTimeout: z.number().default(30000),
    scheduledDelay: z.number().default(5000),
  }).optional(),
  simpleConfig: z.object({
    exportTimeout: z.number().default(30000),
  }).optional(),
});

export const OtelTraceConfigSchema = z.object({
  enabled: z.boolean().default(true),
  serviceName: z.string().default('synthetic-service'),
  instrumentationScopeName: z.string().default('testdx'),
  instrumentationScopeVersion: z.string().default('1.0.0'),
  protocol: z.enum(['grpc', 'http', 'http/json']).default('http'),
  endpoint: z.string().default('http://localhost:4318'),
  timeout: z.number().default(30000),
  compression: CompressionTypeSchema.default('gzip'),
  resourceAttributes: z.record(z.string()).default({}),
  samplerType: SamplerTypeSchema.default('parentbased_traceidratio'),
  samplerParam: z.number().default(1.0),
  spanLimits: SpanLimitsConfigSchema.default(() => ({
    maxNumberOfAttributes: 1000,
    maxNumberOfAttributesPerSpan: 128,
    maxNumberOfEvents: 100,
    maxNumberOfLinks: 100,
    maxNumberOfAttributesPerEvent: 32,
    maxNumberOfAttributesPerLink: 32,
    maxAttributeValueLength: 4096,
  })),
  spanProcessor: SpanProcessorTypeSchema.default('batch'),
  batchConfig: z.object({
    maxQueueSize: z.number().default(2048),
    maxExportBatchSize: z.number().default(512),
    exportTimeout: z.number().default(30000),
    scheduledDelay: z.number().default(5000),
  }).optional(),
  simpleConfig: z.object({
    exportTimeout: z.number().default(30000),
  }).optional(),
  exporters: z.array(ExporterConfigSchema).default([]),
});

export const OtelMetricConfigSchema = z.object({
  enabled: z.boolean().default(true),
  serviceName: z.string().default('synthetic-service'),
  instrumentationScopeName: z.string().default('testdx'),
  instrumentationScopeVersion: z.string().default('1.0.0'),
  protocol: z.enum(['grpc', 'http', 'http/json']).default('http'),
  endpoint: z.string().default('http://localhost:4318'),
  timeout: z.number().default(30000),
  compression: CompressionTypeSchema.default('gzip'),
  resourceAttributes: z.record(z.string()).default({}),
  metricAttributes: z.record(z.string()).default({}),
  temporality: MetricTemporalitySchema.default('cumulative'),
  aggregation: AggregationTypeSchema.default('histogram'),
  metricLimits: MetricLimitsConfigSchema.default(() => ({
    maxNumberOfMetrics: 1000,
    maxNumberOfDataPointsPerMetric: 1000,
    maxNumberOfDataPointValuesPerMetric: 1000,
  })),
  views: z.array(ViewConfigSchema).default([]),
  readers: z.array(MetricReaderTypeSchema).default(['periodic']),
  exporters: z.array(ExporterConfigSchema).default([]),
});

export const OtelLogConfigSchema = z.object({
  enabled: z.boolean().default(true),
  serviceName: z.string().default('synthetic-service'),
  instrumentationScopeName: z.string().default('testdx'),
  instrumentationScopeVersion: z.string().default('1.0.0'),
  protocol: z.enum(['grpc', 'http', 'http/json']).default('http'),
  endpoint: z.string().default('http://localhost:4318'),
  timeout: z.number().default(30000),
  compression: CompressionTypeSchema.default('gzip'),
  includeTraceId: z.boolean().default(true),
  includeSpanId: z.boolean().default(true),
  includeResourceAttributes: z.boolean().default(true),
  includeLogLevel: z.boolean().default(true),
  includeSystemAttributes: z.boolean().default(false),
  resourceAttributes: z.record(z.string()).default({}),
  logAttributes: z.record(z.string()).default({}),
  maxNumberOfAttributes: z.number().default(100),
  maxNumberOfAttributesPerLogRecord: z.number().default(32),
  maxNumberOfLogRecords: z.number().default(1000),
  exporters: z.array(ExporterConfigSchema).default([]),
});

export const OtelResourceConfigSchema = z.object({
  serviceName: z.string().default('synthetic-service'),
  serviceNamespace: z.string().optional(),
  serviceInstanceId: z.string().optional(),
  serviceVersion: z.string().optional(),
  deploymentEnvironment: z.string().optional(),
  attributes: z.record(z.string()).default({}),
});

export const OtelPropagatorConfigSchema = z.object({
  propagators: z.array(PropagatorTypeSchema).default(['w3c']),
  baggageKeys: z.array(z.string()).default([]),
});

export const OtelSdkConfigSchema = z.object({
  sdkName: z.string().default('opentelemetry-js'),
  sdkVersion: z.string().default('1.0.0'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  resource: OtelResourceConfigSchema,
  propagators: OtelPropagatorConfigSchema,
  trace: OtelTraceConfigSchema,
  metric: OtelMetricConfigSchema,
  log: OtelLogConfigSchema,
});