import mongoose, { Schema } from 'mongoose';

import {
  SpanLimitsConfig,
  MetricLimitsConfig,
  ViewConfig,
  ExporterConfig,
  SpanProcessorConfig,
} from '../interfaces';

import {
  AggregationType,
  ExporterType,
  OtelProtocol,
  CompressionType,
  SpanProcessorType,
} from '../enums';

export const SpanLimitsConfigSchema = new Schema<SpanLimitsConfig>({
  maxNumberOfAttributes: { type: Number, default: 1000 },
  maxNumberOfAttributesPerSpan: { type: Number, default: 128 },
  maxNumberOfEvents: { type: Number, default: 100 },
  maxNumberOfLinks: { type: Number, default: 100 },
  maxNumberOfAttributesPerEvent: { type: Number, default: 32 },
  maxNumberOfAttributesPerLink: { type: Number, default: 32 },
  maxAttributeValueLength: { type: Number, default: 4096 },
}, { _id: false });

export const MetricLimitsConfigSchema = new Schema<MetricLimitsConfig>({
  maxNumberOfMetrics: { type: Number, default: 1000 },
  maxNumberOfDataPointsPerMetric: { type: Number, default: 1000 },
  maxNumberOfDataPointValuesPerMetric: { type: Number, default: 1000 },
}, { _id: false });

export const ViewConfigSchema = new Schema<ViewConfig>({
  name: { type: String, required: true },
  description: { type: String },
  unit: { type: String },
  attributeKeys: { type: [String], default: [] },
  aggregation: { type: String, enum: AggregationType },
  histogramBucketBoundaries: { type: [Number], default: [] },
}, { _id: false });

export const ExporterConfigSchema = new Schema<ExporterConfig>({
  type: { type: String, enum: ExporterType, required: true },
  endpoint: { type: String, required: true },
  protocol: { type: String, enum: OtelProtocol, default: OtelProtocol.HTTP },
  timeout: { type: Number, default: 30000 },
  compression: { type: String, enum: CompressionType, default: CompressionType.GZIP },
  headers: { type: Schema.Types.Mixed },
  tlsConfig: {
    insecure: { type: Boolean, default: true },
    caFile: { type: String },
    certFile: { type: String },
    keyFile: { type: String },
  },
}, { _id: false });

export const SpanProcessorConfigSchema = new Schema<SpanProcessorConfig>({
  type: { type: String, enum: SpanProcessorType, required: true },
  batchConfig: {
    maxQueueSize: { type: Number, default: 2048 },
    maxExportBatchSize: { type: Number, default: 512 },
    exportTimeout: { type: Number, default: 30000 },
    scheduledDelay: { type: Number, default: 5000 },
  },
  simpleConfig: {
    exportTimeout: { type: Number, default: 30000 },
  },
}, { _id: false });