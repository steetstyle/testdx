import { RunMode, RunStatus } from '../../models/scenario';
import {
  buildTraceResult,
  buildMetricResult,
  buildLogResult,
  buildUnifiedResult,
} from '../../services/syntheticRunner/utils/resultBuilder';

describe('resultBuilder', () => {
  const timestamp = '2026-03-28T10:00:00.000Z';
  const mode: RunMode = RunMode.REALTIME;

  describe('buildTraceResult', () => {
    it('should build successful trace result', () => {
      const data = { recordsGenerated: 100, errors: [] };
      const result = buildTraceResult(data, mode, timestamp);

      expect(result.runResult.success).toBe(true);
      expect(result.runResult.recordsGenerated).toBe(100);
      expect(result.runResult.tracesGenerated).toBe(100);
      expect(result.runResult.metricsGenerated).toBe(0);
      expect(result.runResult.logsGenerated).toBe(0);
      expect(result.runEntry.status).toBe('success');
      expect(result.runEntry.recordsGenerated).toBe(100);
      expect(result.runEntry.tracesGenerated).toBe(100);
    });

    it('should build failed trace result with errors', () => {
      const data = { recordsGenerated: 50, errors: ['error1', 'error2'] };
      const result = buildTraceResult(data, mode, timestamp);

      expect(result.runResult.success).toBe(false);
      expect(result.runEntry.status).toBe('failed');
      expect(result.runEntry.error).toBe('error1; error2');
    });

    it('should deduplicate errors in runEntry', () => {
      const data = { recordsGenerated: 50, errors: ['error', 'error', 'different'] };
      const result = buildTraceResult(data, mode, timestamp);

      expect(result.runEntry.error).toBe('error; different');
    });
  });

  describe('buildMetricResult', () => {
    it('should build successful metric result', () => {
      const data = { recordsGenerated: 200, errors: [] };
      const result = buildMetricResult(data, mode, timestamp);

      expect(result.runResult.success).toBe(true);
      expect(result.runResult.recordsGenerated).toBe(200);
      expect(result.runResult.tracesGenerated).toBe(0);
      expect(result.runResult.metricsGenerated).toBe(200);
      expect(result.runResult.logsGenerated).toBe(0);
      expect(result.runEntry.status).toBe('success');
    });

    it('should build failed metric result', () => {
      const data = { recordsGenerated: 0, errors: ['connection failed'] };
      const result = buildMetricResult(data, mode, timestamp);

      expect(result.runResult.success).toBe(false);
      expect(result.runEntry.status).toBe('failed');
      expect(result.runEntry.error).toBe('connection failed');
    });
  });

  describe('buildLogResult', () => {
    it('should build successful log result', () => {
      const data = { recordsGenerated: 150, errors: [] };
      const result = buildLogResult(data, mode, timestamp);

      expect(result.runResult.success).toBe(true);
      expect(result.runResult.recordsGenerated).toBe(150);
      expect(result.runResult.tracesGenerated).toBe(0);
      expect(result.runResult.metricsGenerated).toBe(0);
      expect(result.runResult.logsGenerated).toBe(150);
      expect(result.runEntry.status).toBe('success');
    });

    it('should build failed log result', () => {
      const data = { recordsGenerated: 0, errors: ['timeout'] };
      const result = buildLogResult(data, mode, timestamp);

      expect(result.runResult.success).toBe(false);
      expect(result.runEntry.status).toBe('failed');
      expect(result.runEntry.error).toBe('timeout');
    });
  });

  describe('buildUnifiedResult', () => {
    it('should build successful unified result', () => {
      const data = { traces: 100, metrics: 200, logs: 150, errors: [] };
      const result = buildUnifiedResult(data, mode, timestamp);

      expect(result.runResult.success).toBe(true);
      expect(result.runResult.recordsGenerated).toBe(450);
      expect(result.runResult.tracesGenerated).toBe(100);
      expect(result.runResult.metricsGenerated).toBe(200);
      expect(result.runResult.logsGenerated).toBe(150);
      expect(result.runEntry.status).toBe('success');
    });

    it('should build failed unified result', () => {
      const data = { traces: 50, metrics: 100, logs: 75, errors: ['partial failure'] };
      const result = buildUnifiedResult(data, mode, timestamp);

      expect(result.runResult.success).toBe(false);
      expect(result.runResult.error).toBe('partial failure');
      expect(result.runEntry.status).toBe('failed');
    });

    it('should handle mixed telemetry counts', () => {
      const data = { traces: 10, metrics: 20, logs: 30, errors: [] };
      const result = buildUnifiedResult(data, mode, timestamp);

      expect(result.runResult.recordsGenerated).toBe(60);
      expect(result.runEntry.recordsGenerated).toBe(60);
    });
  });
});