import { SyntheticScenario, TelemetryType } from '../../models/scenario';
import { OtelGenerator } from '../otel';
import { RunResult, RunProgress } from './utils/types';
import { OTLP_ENDPOINT } from './utils/constants';
import { RateLimiter } from './utils/rateLimiter';
import { ProcessState } from './utils/processState';
import { calculateTimeRange } from './utils/timeRangeCalculator';
import { buildTraceResult, buildMetricResult, buildLogResult, buildUnifiedResult } from './utils/resultBuilder';
import { updateWithResult, updateProgress } from './utils/progressUpdater';
import { handleRunnerError } from './utils/errorHandler';
import { createGenerator, getServiceEndpoint } from './serviceResolver';
import { getMergedVariables } from './variablesResolver';
import { Scheduler } from './scheduler';
import { checkPreFlight } from './preFlightChecker';
import { runTraces, TraceResult } from './telemetryRunners/tracesRunner';
import { runMetrics, MetricResult } from './telemetryRunners/metricsRunner';
import { runLogs, LogResult } from './telemetryRunners/logsRunner';
import { runUnified, UnifiedResult } from './telemetryRunners/unifiedRunner';

export function calculateBaseRate(distribution: any): number {
  if (!distribution) return 10;
  
  switch (distribution.type) {
    case 'fixed':
      return distribution.rate ?? 10;
    case 'uniform':
      return ((distribution.min ?? 1) + (distribution.max ?? 10)) / 2;
    case 'gaussian':
      return distribution.mean ?? 10;
    case 'linearRamp':
      return ((distribution.start ?? 5) + (distribution.end ?? 20)) / 2;
    case 'exponentialRamp':
      return distribution.start ?? 5;
    case 'sine':
      return distribution.base ?? 10;
    case 'square':
    case 'triangle':
      return ((distribution.min ?? 5) + (distribution.max ?? 20)) / 2;
    case 'burst':
      return distribution.baseRate ?? 5;
    case 'poisson':
      return distribution.lambda ?? 10;
    case 'exponential':
      return distribution.lambda ?? 1;
    default:
      return 10;
  }
}

export class SyntheticRunner {
  private static instance: SyntheticRunner;
  private defaultGenerator: OtelGenerator;
  private processState: ProcessState;
  private rateLimiter: RateLimiter;
  private scheduler: Scheduler;

  private constructor() {
    this.defaultGenerator = new OtelGenerator({ endpoint: OTLP_ENDPOINT });
    this.processState = new ProcessState();
    this.rateLimiter = new RateLimiter();
    this.scheduler = new Scheduler(this);
  }

  public static getInstance(): SyntheticRunner {
    if (!SyntheticRunner.instance) {
      SyntheticRunner.instance = new SyntheticRunner();
    }
    return SyntheticRunner.instance;
  }

  async runScenario(
    scenarioId: string,
    mode: 'realtime' | 'historical' = 'realtime',
    timeRange?: { start: Date; end: Date },
    durationOverride?: number
  ): Promise<RunResult> {
    const preFlight = await checkPreFlight(scenarioId, this.processState, this.rateLimiter);
    if (!preFlight.valid) {
      return {
        success: false,
        recordsGenerated: 0,
        tracesGenerated: 0,
        metricsGenerated: 0,
        logsGenerated: 0,
        error: preFlight.error,
      };
    }

    const scenario = preFlight.scenario;
    const endpoint = await getServiceEndpoint(scenario.serviceId.toString());
    console.log(`[SyntheticRunner] Starting scenario ${scenarioId} (${scenario.name}) with endpoint: ${endpoint}, mode: ${mode}`);

    const generator = await createGenerator(scenario.serviceId.toString());
    const distribution = scenario.distribution?.toObject ? scenario.distribution.toObject() : { ...scenario.distribution };
    const duration = durationOverride ?? (distribution as any).duration ?? 60;
    
    const rate = calculateBaseRate(distribution);
    console.log(`[Runner] Distribution:`, JSON.stringify(distribution));
    console.log(`[Runner] Calculated base rate:`, rate);

    const globalVariables = await getMergedVariables(
      scenario.projectId?.toString(),
      scenario.serviceId?.toString()
    );

    const timeRangeResult = calculateTimeRange(
      { ...distribution, duration },
      mode,
      timeRange
    );

    if (timeRangeResult.waitMs) {
      console.log(`[SyntheticRunner] Waiting ${timeRangeResult.waitMs}ms before starting`);
      await new Promise(resolve => setTimeout(resolve, timeRangeResult.waitMs));
    }

    const initialProgress: RunProgress = {
      startedAt: new Date().toISOString(),
      mode: mode as any,
      rate: rate,
      duration,
      tracesGenerated: 0,
      metricsGenerated: 0,
      logsGenerated: 0,
      totalRecords: 0,
      totalExpected: timeRangeResult.totalExpected,
      status: 'running',
    };

    try {
      this.processState.markRunning(scenarioId);
      this.processState.clearCancellation(scenarioId);
      await updateProgress(scenarioId, initialProgress);

      const timestamp = new Date().toISOString();
      let runResult: RunResult;
      let runEntry: any;

      const signal = {
        isCancelled: () => this.processState.isCancelled(scenarioId),
      };

      if (scenario.telemetryType === TelemetryType.UNIFIED) {
        const params = scenario.params?.toObject ? scenario.params.toObject() : { ...scenario.params };
        console.log('[Runner] Running unified with params:', JSON.stringify(params).substring(0, 300));
        const unifiedResult = await runUnified({
          generator,
          params,
          rate,
          rateConfig: undefined,
          duration,
          timeRangeResult,
          distribution: scenario.distribution?.toObject ? scenario.distribution.toObject() : scenario.distribution,
          globalVariables,
          scenarioVariables: scenario.variables?.toObject ? scenario.variables.toObject() : scenario.variables || {},
          scenarioAttributes: scenario.attributes?.toObject ? scenario.attributes.toObject() : scenario.attributes || {},
          signal,
          onProgress: async (progress: any) => {
            await updateProgress(scenarioId, {
              ...initialProgress,
              tracesGenerated: progress.traces,
              metricsGenerated: progress.metrics,
              logsGenerated: progress.logs,
              totalRecords: progress.total,
            });
          },
        });

        this.rateLimiter.increment(scenarioId);
        const wasStopped = unifiedResult.errors.includes('Scenario stopped by user');
        const result = buildUnifiedResult(unifiedResult, mode as any, timestamp);
        runResult = result.runResult;
        runEntry = result.runEntry;

        await updateWithResult(scenarioId, runEntry, {
          ...initialProgress,
          tracesGenerated: unifiedResult.traces,
          metricsGenerated: unifiedResult.metrics,
          logsGenerated: unifiedResult.logs,
          totalRecords: runResult.recordsGenerated,
          status: wasStopped ? 'stopped' : (unifiedResult.errors.length === 0 ? 'completed' : 'failed'),
          error: runResult.error,
        });
      } else {
        const params = scenario.params?.toObject ? scenario.params.toObject() : { ...scenario.params };
        switch (scenario.telemetryType) {
          case TelemetryType.TRACES: {
            const traceResult = await runTraces({
              generator,
              params,
              rate,
              duration,
              timeRangeResult,
              options: { endpoint, serviceName: 'synthetic-service' },
              scenarioAttributes: scenario.attributes || {},
              signal,
            });

            const result = buildTraceResult(traceResult, mode as any, timestamp);
            runResult = result.runResult;
            runEntry = result.runEntry;

            await updateWithResult(scenarioId, runEntry, {
              ...initialProgress,
              tracesGenerated: runResult.tracesGenerated,
              totalRecords: runResult.recordsGenerated,
              status: runEntry.status,
              error: runEntry.error,
            });
            break;
          }
          case TelemetryType.METRICS: {
            const metricResult = await runMetrics({
              generator,
              params,
              rate,
              duration,
              timeRangeResult,
              distribution: scenario.distribution,
              scenarioAttributes: scenario.attributes || {},
              signal,
            });

            const result = buildMetricResult(metricResult, mode as any, timestamp);
            runResult = result.runResult;
            runEntry = result.runEntry;

            await updateWithResult(scenarioId, runEntry, {
              ...initialProgress,
              metricsGenerated: runResult.metricsGenerated,
              totalRecords: runResult.recordsGenerated,
              status: runEntry.status,
              error: runEntry.error,
            });
            break;
          }
          case TelemetryType.LOGS: {
            const logResult = await runLogs({
              generator,
              params,
              rate,
              duration,
              timeRangeResult,
              scenarioAttributes: scenario.attributes || {},
              signal,
            });

            const result = buildLogResult(logResult, mode as any, timestamp);
            runResult = result.runResult;
            runEntry = result.runEntry;

            await updateWithResult(scenarioId, runEntry, {
              ...initialProgress,
              logsGenerated: runResult.logsGenerated,
              totalRecords: runResult.recordsGenerated,
              status: runEntry.status,
              error: runEntry.error,
            });
            break;
          }
          default:
            runResult = {
              success: false,
              recordsGenerated: 0,
              tracesGenerated: 0,
              metricsGenerated: 0,
              logsGenerated: 0,
              error: 'Unknown telemetry type',
            };
        }
      }

      return runResult;
    } catch (err) {
      return await handleRunnerError(scenarioId, err, initialProgress);
    } finally {
      this.processState.markStopped(scenarioId);
    }
  }

  async checkScheduledScenarios(): Promise<void> {
    await this.scheduler.checkScheduledScenarios();
  }

  async startEnabledSchedulesOnStartup(): Promise<void> {
    await this.scheduler.startEnabledSchedulesOnStartup();
  }

  async startSchedule(scenarioId: string): Promise<boolean> {
    await this.scheduler.startSchedule(scenarioId);
    return true;
  }

  async stopSchedule(scenarioId: string): Promise<boolean> {
    await this.scheduler.stopSchedule(scenarioId);
    return true;
  }

  async stopScenario(scenarioId: string): Promise<boolean> {
    const wasRunning = this.processState.isRunning(scenarioId);
    this.processState.cancel(scenarioId);
    
    if (wasRunning) {
      await updateProgress(scenarioId, {
        status: 'stopped',
      });
    }
    
    return true;
  }

  markRunningForStop(scenarioId: string): void {
    this.processState.markRunning(scenarioId);
  }

  isRunning(scenarioId: string): boolean {
    return this.processState.isRunning(scenarioId);
  }

  async testConnection(): Promise<boolean> {
    return this.defaultGenerator.testConnection();
  }

  setHourlyCountForTesting(scenarioId: string, count: number): void {
    this.rateLimiter.setCountForTesting(scenarioId, count);
  }

  setRunningForTesting(scenarioId: string): void {
    this.processState.setRunningForTesting(scenarioId);
  }
}

export default SyntheticRunner;