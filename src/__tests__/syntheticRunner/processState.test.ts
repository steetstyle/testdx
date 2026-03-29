import { ProcessState } from '../../services/syntheticRunner/utils/processState';

describe('ProcessState', () => {
  let processState: ProcessState;

  beforeEach(() => {
    processState = new ProcessState();
  });

  describe('isRunning', () => {
    it('should return false for non-running scenario', () => {
      expect(processState.isRunning('scenario-1')).toBe(false);
    });

    it('should return true after marking as running', () => {
      processState.markRunning('scenario-1');
      expect(processState.isRunning('scenario-1')).toBe(true);
    });

    it('should return false after marking as stopped', () => {
      processState.markRunning('scenario-1');
      processState.markStopped('scenario-1');
      expect(processState.isRunning('scenario-1')).toBe(false);
    });
  });

  describe('markRunning', () => {
    it('should set scenario to running state', () => {
      processState.markRunning('scenario-1');
      expect(processState.isRunning('scenario-1')).toBe(true);
    });

    it('should overwrite previous state', () => {
      processState.markStopped('scenario-1');
      processState.markRunning('scenario-1');
      expect(processState.isRunning('scenario-1')).toBe(true);
    });
  });

  describe('markStopped', () => {
    it('should set scenario to stopped state', () => {
      processState.markRunning('scenario-1');
      processState.markStopped('scenario-1');
      expect(processState.isRunning('scenario-1')).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return undefined for non-existent scenario', () => {
      expect(processState.getStatus('scenario-1')).toBeUndefined();
    });

    it('should return true when running', () => {
      processState.markRunning('scenario-1');
      expect(processState.getStatus('scenario-1')).toBe(true);
    });

    it('should return false when stopped', () => {
      processState.markRunning('scenario-1');
      processState.markStopped('scenario-1');
      expect(processState.getStatus('scenario-1')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all processes', () => {
      processState.markRunning('scenario-1');
      processState.markRunning('scenario-2');
      processState.clear();
      expect(processState.isRunning('scenario-1')).toBe(false);
      expect(processState.isRunning('scenario-2')).toBe(false);
    });
  });

  describe('setRunningForTesting', () => {
    it('should set scenario to running for testing', () => {
      processState.setRunningForTesting('scenario-1');
      expect(processState.isRunning('scenario-1')).toBe(true);
    });
  });

  describe('cancellation', () => {
    it('should return false for isCancelled initially', () => {
      expect(processState.isCancelled('scenario-1')).toBe(false);
    });

    it('should return true after cancel is called', () => {
      processState.cancel('scenario-1');
      expect(processState.isCancelled('scenario-1')).toBe(true);
    });

    it('should return false after clearCancellation is called', () => {
      processState.cancel('scenario-1');
      processState.clearCancellation('scenario-1');
      expect(processState.isCancelled('scenario-1')).toBe(false);
    });

    it('should allow cancelling a running scenario', () => {
      processState.markRunning('scenario-1');
      processState.cancel('scenario-1');
      expect(processState.isRunning('scenario-1')).toBe(true);
      expect(processState.isCancelled('scenario-1')).toBe(true);
    });

    it('should handle cancelling multiple scenarios independently', () => {
      processState.cancel('scenario-1');
      processState.cancel('scenario-2');
      expect(processState.isCancelled('scenario-1')).toBe(true);
      expect(processState.isCancelled('scenario-2')).toBe(true);
      processState.clearCancellation('scenario-1');
      expect(processState.isCancelled('scenario-1')).toBe(false);
      expect(processState.isCancelled('scenario-2')).toBe(true);
    });
  });
});