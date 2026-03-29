import { createErrorResult, createErrorProgress } from '../../services/syntheticRunner/utils/errorHandler';
import { RunMode } from '../../models/scenario';
import { RunProgress } from '../../services/syntheticRunner/utils/types';

describe('errorHandler', () => {
  const initialProgress: RunProgress = {
    startedAt: '2026-03-28T10:00:00.000Z',
    mode: RunMode.REALTIME,
    rate: 10,
    duration: 60,
    tracesGenerated: 0,
    metricsGenerated: 0,
    logsGenerated: 0,
    totalRecords: 0,
    totalExpected: 600,
    status: 'running',
  };

  describe('createErrorResult', () => {
    it('should create error result from Error object', () => {
      const error = new Error('test error message');
      const result = createErrorResult(error, initialProgress);

      expect(result.success).toBe(false);
      expect(result.recordsGenerated).toBe(0);
      expect(result.tracesGenerated).toBe(0);
      expect(result.metricsGenerated).toBe(0);
      expect(result.logsGenerated).toBe(0);
      expect(result.error).toBe('test error message');
    });

    it('should create error result from string', () => {
      const error = 'string error';
      const result = createErrorResult(error, initialProgress);

      expect(result.error).toBe('string error');
    });

    it('should create error result from unknown object', () => {
      const error = { code: 500, message: 'server error' };
      const result = createErrorResult(error, initialProgress);

      expect(result.error).toBe('Unknown error');
    });

    it('should create error result from null', () => {
      const result = createErrorResult(null, initialProgress);
      expect(result.error).toBe('Unknown error');
    });

    it('should create error result from undefined', () => {
      const result = createErrorResult(undefined, initialProgress);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('createErrorProgress', () => {
    it('should create error progress from Error object', () => {
      const error = new Error('progress error');
      const result = createErrorProgress(error, initialProgress);

      expect(result.status).toBe('failed');
      expect(result.error).toBe('progress error');
      expect(result.startedAt).toBe(initialProgress.startedAt);
      expect(result.rate).toBe(initialProgress.rate);
    });

    it('should preserve other progress fields', () => {
      const error = new Error('fail');
      const result = createErrorProgress(error, initialProgress);

      expect(result.duration).toBe(initialProgress.duration);
      expect(result.totalExpected).toBe(initialProgress.totalExpected);
      expect(result.tracesGenerated).toBe(initialProgress.tracesGenerated);
    });

    it('should handle non-Error objects', () => {
      const error = 'string error';
      const result = createErrorProgress(error, initialProgress);

      expect(result.status).toBe('failed');
      expect(result.error).toBe('string error');
    });
  });
});