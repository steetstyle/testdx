import { RateLimiter } from '../../services/syntheticRunner/utils/rateLimiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
  });

  afterEach(() => {
    rateLimiter.destroy();
  });

  describe('checkLimit', () => {
    it('should return false when under limit', () => {
      const result = rateLimiter.checkLimit('scenario-1', 100);
      expect(result).toBe(false);
    });

    it('should return true when at limit', () => {
      rateLimiter.setCountForTesting('scenario-1', 100);
      const result = rateLimiter.checkLimit('scenario-1', 100);
      expect(result).toBe(true);
    });

    it('should return true when over limit', () => {
      rateLimiter.setCountForTesting('scenario-1', 150);
      const result = rateLimiter.checkLimit('scenario-1', 100);
      expect(result).toBe(true);
    });
  });

  describe('increment', () => {
    it('should increment count by 1', () => {
      rateLimiter.increment('scenario-1');
      expect(rateLimiter.getCurrentCount('scenario-1')).toBe(1);
    });

    it('should increment existing count', () => {
      rateLimiter.increment('scenario-1');
      rateLimiter.increment('scenario-1');
      rateLimiter.increment('scenario-1');
      expect(rateLimiter.getCurrentCount('scenario-1')).toBe(3);
    });

    it('should track different scenarios independently', () => {
      rateLimiter.increment('scenario-1');
      rateLimiter.increment('scenario-1');
      rateLimiter.increment('scenario-2');
      expect(rateLimiter.getCurrentCount('scenario-1')).toBe(2);
      expect(rateLimiter.getCurrentCount('scenario-2')).toBe(1);
    });
  });

  describe('getCurrentCount', () => {
    it('should return 0 for non-existent scenario', () => {
      expect(rateLimiter.getCurrentCount('scenario-1')).toBe(0);
    });

    it('should return current count', () => {
      rateLimiter.increment('scenario-1');
      rateLimiter.increment('scenario-1');
      expect(rateLimiter.getCurrentCount('scenario-1')).toBe(2);
    });
  });

  describe('getHourlyKey', () => {
    it('should include scenario ID and current hour', () => {
      const key = rateLimiter.getHourlyKey('scenario-1');
      const currentHour = new Date().getHours();
      expect(key).toBe(`scenario-1-${currentHour}`);
    });
  });

  describe('reset', () => {
    it('should clear all counts', () => {
      rateLimiter.increment('scenario-1');
      rateLimiter.increment('scenario-2');
      rateLimiter.reset();
      expect(rateLimiter.getCurrentCount('scenario-1')).toBe(0);
      expect(rateLimiter.getCurrentCount('scenario-2')).toBe(0);
    });
  });

  describe('setCountForTesting', () => {
    it('should set count to specific value', () => {
      rateLimiter.setCountForTesting('scenario-1', 50);
      expect(rateLimiter.getCurrentCount('scenario-1')).toBe(50);
    });
  });
});