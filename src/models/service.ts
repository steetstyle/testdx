import mongoose, { Schema, Document } from 'mongoose';

import {
  OtelProtocol,
  LogLevel,
  MetricTemporality,
  AggregationType,
  SamplerType,
  ExporterType,
  SpanProcessorType,
  PropagatorType,
  CompressionType,
  MetricReaderType,
} from './otel/enums';

import {
  SpanProcessorConfig,
  ExporterConfig,
  SpanLimitsConfig,
  MetricLimitsConfig,
  ViewConfig,
  OtelTraceConfig,
  OtelMetricConfig,
  OtelLogConfig,
  OtelPropagatorConfig,
  OtelResourceConfig,
  OtelSdkConfig,
} from './otel/interfaces';

import {
  defaultOtelSdkConfig,
} from './otel/defaults';

import {
  SpanLimitsConfigSchema,
  MetricLimitsConfigSchema,
  ViewConfigSchema,
  ExporterConfigSchema,
} from './otel/schemas/subdocs';

import {
  OtelTraceConfigSchema,
  OtelMetricConfigSchema,
  OtelLogConfigSchema,
  OtelResourceConfigSchema,
  OtelPropagatorConfigSchema,
  OtelSdkConfigSchema,
} from './otel/schemas/config';

export {
  OtelProtocol,
  LogLevel,
  MetricTemporality,
  AggregationType,
  SamplerType,
  ExporterType,
  SpanProcessorType,
  PropagatorType,
  CompressionType,
  MetricReaderType,
  SpanProcessorConfig,
  ExporterConfig,
  SpanLimitsConfig,
  MetricLimitsConfig,
  ViewConfig,
  OtelTraceConfig,
  OtelMetricConfig,
  OtelLogConfig,
  OtelPropagatorConfig,
  OtelResourceConfig,
  OtelSdkConfig,
  defaultOtelSdkConfig,
};

export interface IService {
  projectId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  otelSdkConfig: OtelSdkConfig;
  serviceVariables?: Record<string, string | number | boolean | string[] | number[]>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceDocument extends Omit<IService, '_id'>, Document {}

const ServiceSchema = new Schema<ServiceDocument>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: false, trim: true, maxlength: 500, default: '' },
  otelSdkConfig: { type: OtelSdkConfigSchema, required: true, default: () => defaultOtelSdkConfig },
  serviceVariables: { type: Schema.Types.Mixed, default: {} },
  isActive: { type: Boolean, required: true, default: true, index: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

ServiceSchema.index({ projectId: 1, isActive: 1 });

export const Service = mongoose.model<ServiceDocument>('Service', ServiceSchema);
export default Service;