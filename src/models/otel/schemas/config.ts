import mongoose, { Schema } from 'mongoose';

import {
  OtelTraceConfig,
  OtelMetricConfig,
  OtelLogConfig,
  OtelResourceConfig,
  OtelPropagatorConfig,
  OtelSdkConfig,
} from '../interfaces';

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
} from '../enums';

import {
  SpanLimitsConfigSchema,
  MetricLimitsConfigSchema,
  ViewConfigSchema,
  ExporterConfigSchema,
} from './subdocs';

import {
  defaultSpanLimits,
  defaultMetricLimits,
  defaultOtelTraceConfig,
  defaultOtelMetricConfig,
  defaultOtelLogConfig,
  defaultOtelResourceConfig,
  defaultOtelPropagatorConfig,
} from '../defaults';

export const OtelTraceConfigSchema = new Schema<OtelTraceConfig>({
  enabled: { type: Boolean, default: true },
  serviceName: { type: String, default: 'synthetic-service' },
  instrumentationScopeName: { type: String, default: 'testdx' },
  instrumentationScopeVersion: { type: String, default: '1.0.0' },
  protocol: { type: String, enum: OtelProtocol, default: OtelProtocol.HTTP },
  endpoint: { type: String, default: 'http://localhost:4318' },
  timeout: { type: Number, default: 30000 },
  compression: { type: String, enum: CompressionType, default: CompressionType.GZIP },
  resourceAttributes: { type: Schema.Types.Mixed, default: {} },
  samplerType: { type: String, enum: SamplerType, default: SamplerType.PARENT_BASED_TRACE_ID },
  samplerParam: { type: Number, default: 1.0 },
  spanLimits: { type: SpanLimitsConfigSchema, default: defaultSpanLimits },
  spanProcessor: { type: String, enum: SpanProcessorType, default: SpanProcessorType.BATCH },
  batchConfig: {
    maxQueueSize: { type: Number, default: 2048 },
    maxExportBatchSize: { type: Number, default: 512 },
    exportTimeout: { type: Number, default: 30000 },
    scheduledDelay: { type: Number, default: 5000 },
  },
  simpleConfig: {
    exportTimeout: { type: Number, default: 30000 },
  },
  exporters: { type: [ExporterConfigSchema], default: [] },
}, { _id: false });

export const OtelMetricConfigSchema = new Schema<OtelMetricConfig>({
  enabled: { type: Boolean, default: true },
  serviceName: { type: String, default: 'synthetic-service' },
  instrumentationScopeName: { type: String, default: 'testdx' },
  instrumentationScopeVersion: { type: String, default: '1.0.0' },
  protocol: { type: String, enum: OtelProtocol, default: OtelProtocol.HTTP },
  endpoint: { type: String, default: 'http://localhost:4318' },
  timeout: { type: Number, default: 30000 },
  compression: { type: String, enum: CompressionType, default: CompressionType.GZIP },
  resourceAttributes: { type: Schema.Types.Mixed, default: {} },
  metricAttributes: { type: Schema.Types.Mixed, default: {} },
  temporality: { type: String, enum: MetricTemporality, default: MetricTemporality.CUMULATIVE },
  aggregation: { type: String, enum: AggregationType, default: AggregationType.HISTOGRAM },
  metricLimits: { type: MetricLimitsConfigSchema, default: defaultMetricLimits },
  views: { type: [ViewConfigSchema], default: [] },
  readers: { type: [String], default: [MetricReaderType.PERIODIC] },
  exporters: { type: [ExporterConfigSchema], default: [] },
}, { _id: false });

export const OtelLogConfigSchema = new Schema<OtelLogConfig>({
  enabled: { type: Boolean, default: true },
  serviceName: { type: String, default: 'synthetic-service' },
  instrumentationScopeName: { type: String, default: 'testdx' },
  instrumentationScopeVersion: { type: String, default: '1.0.0' },
  protocol: { type: String, enum: OtelProtocol, default: OtelProtocol.HTTP },
  endpoint: { type: String, default: 'http://localhost:4318' },
  timeout: { type: Number, default: 30000 },
  compression: { type: String, enum: CompressionType, default: CompressionType.GZIP },
  includeTraceId: { type: Boolean, default: true },
  includeSpanId: { type: Boolean, default: true },
  includeResourceAttributes: { type: Boolean, default: true },
  includeLogLevel: { type: Boolean, default: true },
  includeSystemAttributes: { type: Boolean, default: false },
  resourceAttributes: { type: Schema.Types.Mixed, default: {} },
  logAttributes: { type: Schema.Types.Mixed, default: {} },
  maxNumberOfAttributes: { type: Number, default: 100 },
  maxNumberOfAttributesPerLogRecord: { type: Number, default: 32 },
  maxNumberOfLogRecords: { type: Number, default: 1000 },
  exporters: { type: [ExporterConfigSchema], default: [] },
}, { _id: false });

export const OtelResourceConfigSchema = new Schema<OtelResourceConfig>({
  serviceName: { type: String, required: true },
  serviceNamespace: { type: String },
  serviceInstanceId: { type: String },
  serviceVersion: { type: String },
  deploymentEnvironment: { type: String },
  attributes: { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

export const OtelPropagatorConfigSchema = new Schema<OtelPropagatorConfig>({
  propagators: { type: [String], enum: PropagatorType, default: [PropagatorType.W3C] },
  baggageKeys: { type: [String], default: [] },
}, { _id: false });

export const OtelSdkConfigSchema = new Schema<OtelSdkConfig>({
  sdkName: { type: String, default: 'opentelemetry-js' },
  sdkVersion: { type: String, default: '1.0.0' },
  logLevel: { type: String, enum: LogLevel, default: LogLevel.INFO },
  resource: { type: OtelResourceConfigSchema, default: defaultOtelResourceConfig },
  propagators: { type: OtelPropagatorConfigSchema, default: defaultOtelPropagatorConfig },
  trace: { type: OtelTraceConfigSchema, default: defaultOtelTraceConfig },
  metric: { type: OtelMetricConfigSchema, default: defaultOtelMetricConfig },
  log: { type: OtelLogConfigSchema, default: defaultOtelLogConfig },
}, { _id: false });