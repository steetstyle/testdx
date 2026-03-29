import mongoose, { Document } from 'mongoose';

import { TelemetryType, DistributionType, RunStatus, RunMode } from './enums';

export interface SpanConfig {
  name: string;
  kind: 'server' | 'client' | 'producer' | 'consumer' | 'internal';
  statusCode: StatusCode;
  attributes: Record<string, string | number | boolean>;
  events: SpanEvent[];
  links: SpanLink[];
  childSpans: number;
  durationMs: number;
}

export interface SpanEvent {
  name: string;
  timestampOffsetMs: number;
  attributes: Record<string, string | number | boolean>;
}

export interface SpanLink {
  traceId: string;
  spanId: string;
  attributes: Record<string, string | number | boolean>;
}

export interface MetricPointConfig {
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  labels: Record<string, string>;
  histogramBuckets?: number[];
}

export interface LogRecordConfig {
  severityNumber: number;
  severityText: string;
  body: string;
  attributes: Record<string, string | number | boolean>;
}

export interface TraceScenarioParams {
  rootSpan: SpanConfig;
  traceAttributes: Record<string, string | number | boolean>;
}

export interface MetricScenarioParams {
  metrics: MetricPointConfig[];
  metricAttributes: Record<string, string>;
}

export interface LogScenarioParams {
  logs: LogRecordConfig[];
  logAttributes: Record<string, string | number | boolean>;
}

export interface UnifiedScenarioParams {
  includeTraces: boolean;
  includeMetrics: boolean;
  includeLogs: boolean;
  rootSpan: SpanConfig;
  traceAttributes: Record<string, string | number | boolean>;
  metrics: MetricPointConfig[];
  logs: LogRecordConfig[];
  correlationEnabled: boolean;
}

export interface ScheduleConfig {
  enabled: boolean;
  cronExpression?: string;
  intervalMs?: number;
}

export interface RunLimits {
  maxConcurrent: number;
  maxPerHour: number;
}

export type VariableValue = string | number | boolean | string[] | number[];

export interface ScenarioVariable {
  name: string;
  value: VariableValue;
}

export interface GlobalVariables {
  [key: string]: VariableValue;
}

export type DistributionObject = {
  gaussian?: { mean?: number; stdDev?: number };
  uniform?: { min?: number; max?: number };
  linear?: { start?: number; end?: number };
  exponential?: { lambda?: number };
  poisson?: { lambda?: number };
};

export type VariableValueWithDistribution = string | number | boolean | string[] | number[] | DistributionObject;

export interface ScenarioVariables {
  [key: string]: VariableValueWithDistribution;
}

export interface UniformConfig {
  type: 'uniform';
  min: number;
  max: number;
}

export interface GaussianConfig {
  type: 'gaussian';
  mean: number;
  stdDev: number;
}

export interface LinearRampConfig {
  type: 'linearRamp';
  start: number;
  end: number;
  duration: number;
}

export interface ExponentialRampConfig {
  type: 'exponentialRamp';
  start: number;
  growth: number;
  duration: number;
  max?: number;
}

export interface SineWaveConfig {
  type: 'sine';
  base: number;
  amplitude: number;
  period: number;
  phase?: number;
}

export interface SquareWaveConfig {
  type: 'square';
  min: number;
  max: number;
  period: number;
}

export interface TriangleWaveConfig {
  type: 'triangle';
  min: number;
  max: number;
  period: number;
}

export interface BurstConfig {
  type: 'burst';
  baseRate: number;
  burstRate: number;
  probability?: number;
}

export interface PoissonConfig {
  type: 'poisson';
  lambda: number;
}

export interface ExponentialConfig {
  type: 'exponential';
  lambda: number;
}

export interface FixedConfig {
  type: 'fixed';
  rate: number;
}

export type DistributionConfig = 
  | UniformConfig 
  | GaussianConfig 
  | LinearRampConfig 
  | ExponentialRampConfig 
  | SineWaveConfig 
  | SquareWaveConfig 
  | TriangleWaveConfig 
  | BurstConfig 
  | PoissonConfig 
  | ExponentialConfig 
  | FixedConfig;

export interface LegacyDistributionConfig {
  type: DistributionType;
  rate?: number;
  interval?: string;
  duration?: number;
  startRate?: number;
  endRate?: number;
  minRate?: number;
  maxRate?: number;
  mean?: number;
  stdDev?: number;
  burstInterval?: string;
  burstRate?: number;
  baseRate?: number;
  lambda?: number;
  min?: number;
  max?: number;
  startDate?: string;
  endDate?: string;
}

export interface RunProgress {
  startedAt: string;
  mode: RunMode;
  rate: number;
  duration?: number;
  tracesGenerated: number;
  metricsGenerated: number;
  logsGenerated: number;
  totalRecords: number;
  totalExpected: number;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

export interface RunHistoryEntry {
  timestamp: string;
  status: RunStatus;
  mode: RunMode;
  recordsGenerated: number;
  tracesGenerated: number;
  metricsGenerated: number;
  logsGenerated: number;
  error?: string;
}

export interface ISyntheticScenario extends Document {
  teamId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  telemetryType: TelemetryType;
  params: TraceScenarioParams | MetricScenarioParams | LogScenarioParams | UnifiedScenarioParams;
  attributes: Record<string, string>;
  distribution: DistributionConfig;
  variables?: ScenarioVariables;
  schedule?: ScheduleConfig;
  limits?: RunLimits;
  isActive: boolean;
  lastRunAt?: Date;
  lastRunStatus?: RunStatus;
  recentRuns: RunHistoryEntry[];
  currentRunProgress?: RunProgress;
  createdAt: Date;
  updatedAt: Date;
}

import { StatusCode, MetricType } from './enums';