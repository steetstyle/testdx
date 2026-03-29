import mongoose, { Schema } from 'mongoose';

import { TelemetryType } from '../enums';

import { ISyntheticScenario } from '../interfaces';

import {
  SpanConfigSchema,
  MetricPointConfigSchema,
  LogRecordConfigSchema,
  DistributionConfigSchema,
  ScheduleConfigSchema,
  RunLimitsSchema,
  ScenarioVariablesSchema,
  RunHistoryEntrySchema,
  RunProgressSchema,
} from './subdocs';

export const TraceScenarioParamsSchema = new Schema({
  rootSpan: { type: SpanConfigSchema, default: () => ({}) },
  traceAttributes: { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

export const MetricScenarioParamsSchema = new Schema({
  metrics: { type: [MetricPointConfigSchema], default: [] },
  metricAttributes: { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

export const LogScenarioParamsSchema = new Schema({
  logs: { type: [LogRecordConfigSchema], default: [] },
  logAttributes: { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

export const UnifiedScenarioParamsSchema = new Schema({
  includeTraces: { type: Boolean, default: true },
  includeMetrics: { type: Boolean, default: true },
  includeLogs: { type: Boolean, default: true },
  rootSpan: { type: SpanConfigSchema, default: () => ({}) },
  traceAttributes: { type: Schema.Types.Mixed, default: {} },
  metrics: { type: [MetricPointConfigSchema], default: [] },
  logs: { type: [LogRecordConfigSchema], default: [] },
  correlationEnabled: { type: Boolean, default: true },
}, { _id: false });

export const SyntheticScenarioSchema = new Schema<ISyntheticScenario>({
  teamId: { type: Schema.Types.ObjectId, required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  telemetryType: { type: String, enum: TelemetryType, default: TelemetryType.UNIFIED },
  params: { type: Schema.Types.Mixed, default: () => ({}) },
  attributes: { type: Schema.Types.Mixed, default: {} },
  distribution: { type: DistributionConfigSchema, default: () => ({}) },
  variables: { type: Schema.Types.Mixed, default: {} },
  schedule: { type: ScheduleConfigSchema },
  limits: { type: RunLimitsSchema, default: () => ({}) },
  isActive: { type: Boolean, default: false },
  lastRunAt: { type: Date },
  lastRunStatus: { type: String, enum: ['success', 'failed', 'running'] },
  recentRuns: { type: [RunHistoryEntrySchema], default: [] },
  currentRunProgress: { type: RunProgressSchema },
}, { timestamps: true });

SyntheticScenarioSchema.index({ teamId: 1, projectId: 1 });
SyntheticScenarioSchema.index({ serviceId: 1, isActive: 1 });

export const Scenario = mongoose.model<ISyntheticScenario>('SyntheticScenario', SyntheticScenarioSchema);
export default Scenario;