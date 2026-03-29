import { Sender } from './sender';
import { MetricPoint, LogRecord } from './types';
import { ParentSpanConfig } from './payloadBuilder';
import { VariableResolver } from '../variables/resolver';
import { GlobalVariables, ScenarioVariables, DistributionParams } from '../variables/types';
import { applyDistribution, DistributionConfig } from './distribution';
import { generateTraces } from './tracesGenerator';
import { generateMetrics } from './metricsGenerator';
import { generateLogs } from './logsGenerator';
import { generateUnified, UnifiedResult } from './unifiedGenerator';

export interface OtelGeneratorOptions {
  endpoint: string;
  serviceName?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface GenerateTracesOptions {
  count: number;
  rate?: number;
  duration?: number;
  rootSpanName: string;
  rootSpanConfig: ParentSpanConfig;
  attributes: Record<string, string | number | boolean>;
  historicalMode?: boolean;
  timeRange?: { start: Date; end: Date };
  signal?: { isCancelled: () => boolean };
}

export interface GenerateMetricsOptions {
  metrics: MetricPoint[];
  count: number;
  rate?: number;
  duration?: number;
  attributes?: Record<string, string | number | boolean>;
  historicalMode?: boolean;
  timeRange?: { start: Date; end: Date };
  distribution?: {
    type: string;
    mean?: number;
    stdDev?: number;
    minRate?: number;
    maxRate?: number;
    startRate?: number;
    endRate?: number;
    burstInterval?: string;
    burstRate?: number;
    baseRate?: number;
  };
  signal?: { isCancelled: () => boolean };
}

export interface GenerateLogsOptions {
  logs: LogRecord[];
  count: number;
  rate?: number;
  duration?: number;
  includeTraceId: boolean;
  attributes?: Record<string, string | number | boolean>;
  historicalMode?: boolean;
  timeRange?: { start: Date; end: Date };
  signal?: { isCancelled: () => boolean };
}

export interface GenerateUnifiedOptions {
  rootSpan: ParentSpanConfig;
  attributes: Record<string, string | number | boolean>;
  metrics: MetricPoint[];
  logs: LogRecord[];
  includeTraces: boolean;
  includeMetrics: boolean;
  includeLogs: boolean;
  correlationEnabled: boolean;
  rate: number;
  rateConfig?: any;
  duration?: number;
  historicalMode?: boolean;
  timeRange?: { start: Date; end: Date };
  distribution?: {
    type: string;
    mean?: number;
    stdDev?: number;
    minRate?: number;
    maxRate?: number;
    startRate?: number;
    endRate?: number;
    burstInterval?: string;
    burstRate?: number;
    baseRate?: number;
  };
  globalVariables?: GlobalVariables;
  scenarioVariables?: ScenarioVariables;
  onProgress?: (progress: { traces: number; metrics: number; logs: number; total: number }) => void;
  signal?: { isCancelled: () => boolean };
}

export interface GenerateResult {
  traces: number;
  metrics: number;
  logs: number;
  errors: string[];
}

export class OtelGenerator {
  private sender: Sender;
  private serviceName: string;
  private resolver: VariableResolver;

  constructor(options: OtelGeneratorOptions) {
    this.sender = new Sender({
      endpoint: options.endpoint,
      timeout: options.timeout,
      headers: options.headers,
    });
    this.serviceName = options.serviceName ?? 'synthetic-service';
    this.resolver = new VariableResolver();
  }

  updateVariableContext(
    globalVariables?: GlobalVariables,
    scenarioVariables?: ScenarioVariables,
    distribution?: DistributionParams
  ): void {
    this.resolver.updateContext(globalVariables, scenarioVariables, distribution);
  }

  resetResolver(): void {
    this.resolver.resetCounters();
  }

  public generateDistributedValue(baseValue: number, distribution?: DistributionConfig): number {
    return applyDistribution(baseValue, distribution);
  }

  async generateTraces(options: GenerateTracesOptions): Promise<{ recordsGenerated: number; errors: string[] }> {
    return generateTraces(this.sender, {
      ...options,
      serviceName: this.serviceName,
    });
  }

  async generateMetrics(options: GenerateMetricsOptions): Promise<{ recordsGenerated: number; errors: string[] }> {
    return generateMetrics(this.sender, {
      ...options,
      serviceName: this.serviceName,
      resolver: {
        resolveValue: (val) => this.resolver.resolveValue(val),
      },
    });
  }

  async generateLogs(options: GenerateLogsOptions): Promise<{ recordsGenerated: number; errors: string[] }> {
    return generateLogs(this.sender, {
      ...options,
      serviceName: this.serviceName,
    });
  }

  async generateUnified(options: GenerateUnifiedOptions): Promise<GenerateResult> {
    return generateUnified(this.sender, {
      ...options,
      serviceName: this.serviceName,
    });
  }

  async testConnection(): Promise<boolean> {
    return this.sender.testConnection();
  }
}

export default OtelGenerator;