import mongoose, { Schema } from 'mongoose';

import {
  StatusCode,
  MetricType,
  DistributionType,
  RunStatus,
  RunMode,
} from '../enums';

import {
  SpanConfig,
  SpanEvent,
  SpanLink,
  MetricPointConfig,
  LogRecordConfig,
  DistributionConfig,
  ScheduleConfig,
  RunLimits,
  ScenarioVariables,
  RunHistoryEntry,
  RunProgress,
} from '../interfaces';

export const SpanEventSchema = new Schema<SpanEvent>({
  name: { type: String, default: 'event' },
  timestampOffsetMs: { type: Number, default: 0 },
  attributes: { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

export const SpanLinkSchema = new Schema<SpanLink>({
  traceId: { type: String },
  spanId: { type: String },
  attributes: { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

export const SpanConfigSchema = new Schema<SpanConfig>({
  name: { type: String, default: 'operation' },
  kind: { type: String, enum: ['server', 'client', 'producer', 'consumer', 'internal'], default: 'server' },
  statusCode: { type: String, enum: StatusCode, default: StatusCode.OK },
  attributes: { type: Schema.Types.Mixed, default: {} },
  events: { type: [SpanEventSchema], default: [] },
  links: { type: [SpanLinkSchema], default: [] },
  childSpans: { type: Number, default: 0 },
  durationMs: { type: Number, default: 100 },
}, { _id: false });

export const MetricPointConfigSchema = new Schema<MetricPointConfig>({
  name: { type: String, required: true },
  type: { type: String, enum: MetricType, default: MetricType.COUNTER },
  value: { type: Number, default: 1 },
  unit: { type: String, default: '1' },
  labels: { type: Schema.Types.Mixed, default: {} },
  histogramBuckets: { type: [Number], default: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] },
}, { _id: false });

export const LogRecordConfigSchema = new Schema<LogRecordConfig>({
  severityNumber: { type: Number, default: 9 },
  severityText: { type: String, default: 'Info' },
  body: { type: String, default: 'Log message' },
  attributes: { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

export const UniformConfigSchema = new Schema({
  type: { type: String, enum: ['uniform'], default: 'uniform' },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 10 },
}, { _id: false });

export const GaussianConfigSchema = new Schema({
  type: { type: String, enum: ['gaussian'], default: 'gaussian' },
  mean: { type: Number, default: 10 },
  stdDev: { type: Number, default: 2 },
}, { _id: false });

export const LinearRampConfigSchema = new Schema({
  type: { type: String, enum: ['linearRamp'], default: 'linearRamp' },
  start: { type: Number, default: 5 },
  end: { type: Number, default: 20 },
  duration: { type: Number, default: 1 },
}, { _id: false });

export const ExponentialRampConfigSchema = new Schema({
  type: { type: String, enum: ['exponentialRamp'], default: 'exponentialRamp' },
  start: { type: Number, default: 5 },
  growth: { type: Number, default: 1.1 },
  duration: { type: Number, default: 1 },
  max: { type: Number },
}, { _id: false });

export const SineWaveConfigSchema = new Schema({
  type: { type: String, enum: ['sine'], default: 'sine' },
  base: { type: Number, default: 10 },
  amplitude: { type: Number, default: 5 },
  period: { type: Number, default: 10 },
  phase: { type: Number, default: 0 },
}, { _id: false });

export const SquareWaveConfigSchema = new Schema({
  type: { type: String, enum: ['square'], default: 'square' },
  min: { type: Number, default: 5 },
  max: { type: Number, default: 20 },
  period: { type: Number, default: 10 },
}, { _id: false });

export const TriangleWaveConfigSchema = new Schema({
  type: { type: String, enum: ['triangle'], default: 'triangle' },
  min: { type: Number, default: 5 },
  max: { type: Number, default: 20 },
  period: { type: Number, default: 10 },
}, { _id: false });

export const BurstConfigSchema = new Schema({
  type: { type: String, enum: ['burst'], default: 'burst' },
  baseRate: { type: Number, default: 5 },
  burstRate: { type: Number, default: 50 },
  probability: { type: Number, default: 0.1 },
}, { _id: false });

export const PoissonConfigSchema = new Schema({
  type: { type: String, enum: ['poisson'], default: 'poisson' },
  lambda: { type: Number, default: 10 },
}, { _id: false });

export const ExponentialConfigSchema = new Schema({
  type: { type: String, enum: ['exponential'], default: 'exponential' },
  lambda: { type: Number, default: 1 },
}, { _id: false });

export const FixedConfigSchema = new Schema({
  type: { type: String, enum: ['fixed'], default: 'fixed' },
  rate: { type: Number, default: 10 },
}, { _id: false });

export const DistributionConfigSchema = new Schema({
  type: { type: String, enum: Object.values(DistributionType), default: DistributionType.FIXED },
  min: { type: Number },
  max: { type: Number },
  mean: { type: Number },
  stdDev: { type: Number },
  start: { type: Number },
  end: { type: Number },
  duration: { type: Number },
  growth: { type: Number },
  amplitude: { type: Number },
  period: { type: Number },
  phase: { type: Number },
  base: { type: Number },
  baseRate: { type: Number },
  burstRate: { type: Number },
  probability: { type: Number },
  lambda: { type: Number },
  rate: { type: Number },
}, { _id: false, discriminator: false });

export const ScheduleConfigSchema = new Schema<ScheduleConfig>({
  enabled: { type: Boolean, default: false },
  cronExpression: { type: String },
  intervalMs: { type: Number },
}, { _id: false });

export const RunLimitsSchema = new Schema<RunLimits>({
  maxConcurrent: { type: Number, default: 1 },
  maxPerHour: { type: Number, default: 100 },
}, { _id: false });

export const ScenarioVariablesSchema = new Schema<ScenarioVariables>({
}, { _id: false });

export const RunHistoryEntrySchema = new Schema<RunHistoryEntry>({
  timestamp: { type: String, required: true },
  status: { type: String, enum: RunStatus, required: true },
  mode: { type: String, enum: RunMode, required: true },
  recordsGenerated: { type: Number, default: 0 },
  tracesGenerated: { type: Number, default: 0 },
  metricsGenerated: { type: Number, default: 0 },
  logsGenerated: { type: Number, default: 0 },
  error: { type: String },
}, { _id: false });

export const RunProgressSchema = new Schema<RunProgress>({
  startedAt: { type: String, required: true },
  mode: { type: String, enum: RunMode, required: true },
  rate: { type: Number, required: true },
  duration: { type: Number },
  tracesGenerated: { type: Number, default: 0 },
  metricsGenerated: { type: Number, default: 0 },
  logsGenerated: { type: Number, default: 0 },
  totalRecords: { type: Number, required: true },
  totalExpected: { type: Number },
  status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
  error: { type: String },
}, { _id: false });