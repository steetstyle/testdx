const { applyDistribution, resolveDistribution, getDistributionStats, validateDistributionConfig } = require('../../../services/otel/distribution');

describe('distribution', () => {
  describe('applyDistribution', () => {
    it('should return base value when no distribution is provided', () => {
      expect(applyDistribution(100)).toBe(100);
      expect(applyDistribution(100, undefined)).toBe(100);
    });

    it('should return base value when distribution type is not provided', () => {
      expect(applyDistribution(100, {})).toBe(100);
      expect(applyDistribution(100, { type: '' })).toBe(100);
    });

    it('should return base value for uniform distribution', () => {
      expect(applyDistribution(100, { type: 'uniform' })).toBe(100);
      expect(applyDistribution(50, { type: 'uniform', stdDev: 10 })).toBe(50);
    });

    it('should apply normal distribution', () => {
      const results: number[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(applyDistribution(100, { type: 'normal', stdDev: 10 }));
      }
      const mean = results.reduce((a, b) => a + b, 0) / results.length;
      expect(mean).toBeGreaterThan(80);
      expect(mean).toBeLessThan(120);
      results.forEach(r => expect(r).toBeGreaterThanOrEqual(0));
    });

    it('should apply gaussian distribution (alias for normal)', () => {
      const results: number[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(applyDistribution(100, { type: 'gaussian', stdDev: 15 }));
      }
      const mean = results.reduce((a, b) => a + b, 0) / results.length;
      expect(mean).toBeGreaterThan(70);
      expect(mean).toBeLessThan(130);
      results.forEach(r => expect(r).toBeGreaterThanOrEqual(0));
    });

    it('should apply linear distribution', () => {
      const results: number[] = [];
      for (let i = 0; i < 1000; i++) {
        results.push(applyDistribution(100, { type: 'linear', minRate: 0.5, maxRate: 1.5 }));
      }
      results.forEach(r => {
        expect(r).toBeGreaterThanOrEqual(50);
        expect(r).toBeLessThanOrEqual(150);
      });
    });

    it('should apply exponential distribution', () => {
      const results: number[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(applyDistribution(100, { type: 'exponential' }));
      }
      results.forEach(r => {
        expect(r).toBeGreaterThanOrEqual(0);
      });
    });

    it('should apply poisson distribution', () => {
      const results: number[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(applyDistribution(10, { type: 'poisson', lambda: 1 }));
      }
      const mean = results.reduce((a, b) => a + b, 0) / results.length;
      expect(mean).toBeGreaterThan(0);
      results.forEach(r => expect(r).toBeGreaterThanOrEqual(0));
    });

    it('should apply burst distribution', () => {
      let burstCount = 0;
      const results: number[] = [];
      for (let i = 0; i < 1000; i++) {
        const result = applyDistribution(10, { type: 'burst', burstRate: 10, baseRate: 1 });
        results.push(result);
        if (result > 15) burstCount++;
      }
      expect(burstCount).toBeGreaterThan(50);
      expect(burstCount).toBeLessThan(150);
    });

    it('should apply random distribution', () => {
      const results: number[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(applyDistribution(100, { type: 'random', minRate: 0.1, maxRate: 2 }));
      }
      results.forEach(r => {
        expect(r).toBeGreaterThanOrEqual(10);
        expect(r).toBeLessThanOrEqual(200);
      });
    });

    it('should handle unknown distribution types', () => {
      expect(applyDistribution(100, { type: 'unknown' })).toBe(100);
    });

    it('should use default stdDev of 10 for normal distribution', () => {
      const results: number[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(applyDistribution(100, { type: 'normal' }));
      }
      const mean = results.reduce((a, b) => a + b, 0) / results.length;
      expect(mean).toBeGreaterThan(80);
      expect(mean).toBeLessThan(120);
    });

    it('should use default burst and base rates', () => {
      const result = applyDistribution(10, { type: 'burst' });
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should use default minRate and maxRate for linear distribution', () => {
      const result = applyDistribution(100, { type: 'linear' });
      expect(result).toBeGreaterThanOrEqual(50);
      expect(result).toBeLessThanOrEqual(150);
    });

    it('should use default minRate and maxRate for random distribution', () => {
      const result = applyDistribution(100, { type: 'random' });
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(200);
    });
  });

  describe('resolveDistribution', () => {
    it('should return undefined when no config is provided', () => {
      expect(resolveDistribution()).toBeUndefined();
    });

    it('should resolve distribution config with all fields', () => {
      const config = {
        type: 'normal',
        mean: 100,
        stdDev: 15,
        minRate: 0.5,
        maxRate: 1.5,
        burstInterval: '1s',
        burstRate: 10,
        baseRate: 1,
        lambda: 2,
      };
      const result = resolveDistribution(config);
      expect(result).toEqual({
        type: 'normal',
        mean: 100,
        stdDev: 15,
        minRate: 0.5,
        maxRate: 1.5,
        burstInterval: '1s',
        burstRate: 10,
        baseRate: 1,
        lambda: 2,
      });
    });

    it('should resolve distribution config with partial fields', () => {
      const config = {
        type: 'linear',
        minRate: 0.5,
        maxRate: 1.5,
      };
      const result = resolveDistribution(config);
      expect(result).toEqual({
        type: 'linear',
        minRate: 0.5,
        maxRate: 1.5,
        stdDev: undefined,
        mean: undefined,
        burstInterval: undefined,
        burstRate: undefined,
        baseRate: undefined,
        lambda: undefined,
      });
    });

    it('should cast type to DistributionParams type', () => {
      const config = { type: 'gaussian' };
      const result = resolveDistribution(config);
      expect(result?.type).toBe('gaussian');
    });
  });

  describe('getDistributionStats', () => {
    it('should return stats for uniform distribution', () => {
      const stats = getDistributionStats('uniform');
      expect(stats).toEqual({
        description: 'Constant value',
        params: [],
      });
    });

    it('should return stats for normal distribution', () => {
      const stats = getDistributionStats('normal');
      expect(stats).toEqual({
        description: 'Bell curve around mean',
        params: ['mean', 'stdDev'],
      });
    });

    it('should return stats for gaussian distribution', () => {
      const stats = getDistributionStats('gaussian');
      expect(stats).toEqual({
        description: 'Bell curve around mean',
        params: ['mean', 'stdDev'],
      });
    });

    it('should return stats for linear distribution', () => {
      const stats = getDistributionStats('linear');
      expect(stats).toEqual({
        description: 'Linear ramp',
        params: ['minRate', 'maxRate'],
      });
    });

    it('should return stats for exponential distribution', () => {
      const stats = getDistributionStats('exponential');
      expect(stats).toEqual({
        description: 'Exponential decay',
        params: ['lambda'],
      });
    });

    it('should return stats for poisson distribution', () => {
      const stats = getDistributionStats('poisson');
      expect(stats).toEqual({
        description: 'Poisson distribution',
        params: ['lambda'],
      });
    });

    it('should return stats for burst distribution', () => {
      const stats = getDistributionStats('burst');
      expect(stats).toEqual({
        description: 'Occasional spikes',
        params: ['burstRate', 'baseRate'],
      });
    });

    it('should return stats for random distribution', () => {
      const stats = getDistributionStats('random');
      expect(stats).toEqual({
        description: 'Random multiplier',
        params: ['minRate', 'maxRate'],
      });
    });

    it('should return unknown stats for unknown distribution', () => {
      const stats = getDistributionStats('unknown');
      expect(stats).toEqual({
        description: 'Unknown',
        params: [],
      });
    });
  });

  describe('validateDistributionConfig', () => {
    it('should return empty array for valid config', () => {
      expect(validateDistributionConfig({ type: 'uniform' })).toEqual([]);
      expect(validateDistributionConfig({ type: 'normal', stdDev: 10 })).toEqual([]);
      expect(validateDistributionConfig({ type: 'linear', minRate: 0.5, maxRate: 1.5 })).toEqual([]);
      expect(validateDistributionConfig({ type: 'exponential', lambda: 1 })).toEqual([]);
      expect(validateDistributionConfig({ type: 'burst', burstRate: 10, baseRate: 1 })).toEqual([]);
    });

    it('should return error for negative stdDev in normal distribution', () => {
      const errors = validateDistributionConfig({ type: 'normal', stdDev: -5 });
      expect(errors).toContain('stdDev must be non-negative');
    });

    it('should return error for negative stdDev in gaussian distribution', () => {
      const errors = validateDistributionConfig({ type: 'gaussian', stdDev: -1 });
      expect(errors).toContain('stdDev must be non-negative');
    });

    it('should return error for negative minRate in linear distribution', () => {
      const errors = validateDistributionConfig({ type: 'linear', minRate: -1, maxRate: 1.5 });
      expect(errors).toContain('minRate must be non-negative');
    });

    it('should return error for negative maxRate in linear distribution', () => {
      const errors = validateDistributionConfig({ type: 'linear', minRate: 0.5, maxRate: -1 });
      expect(errors).toContain('maxRate must be non-negative');
    });

    it('should return error when minRate > maxRate in linear distribution', () => {
      const errors = validateDistributionConfig({ type: 'linear', minRate: 2, maxRate: 1 });
      expect(errors).toContain('minRate must be less than or equal to maxRate');
    });

    it('should return error for negative minRate in random distribution', () => {
      const errors = validateDistributionConfig({ type: 'random', minRate: -0.5, maxRate: 2 });
      expect(errors).toContain('minRate must be non-negative');
    });

    it('should return error for negative maxRate in random distribution', () => {
      const errors = validateDistributionConfig({ type: 'random', minRate: 0.1, maxRate: -1 });
      expect(errors).toContain('maxRate must be non-negative');
    });

    it('should return error when minRate > maxRate in random distribution', () => {
      const errors = validateDistributionConfig({ type: 'random', minRate: 3, maxRate: 1 });
      expect(errors).toContain('minRate must be less than or equal to maxRate');
    });

    it('should return error for non-positive lambda in exponential distribution', () => {
      const errors = validateDistributionConfig({ type: 'exponential', lambda: 0 });
      expect(errors).toContain('lambda must be positive');
    });

    it('should return error for negative lambda in exponential distribution', () => {
      const errors = validateDistributionConfig({ type: 'exponential', lambda: -1 });
      expect(errors).toContain('lambda must be positive');
    });

    it('should return error for non-positive lambda in poisson distribution', () => {
      const errors = validateDistributionConfig({ type: 'poisson', lambda: -5 });
      expect(errors).toContain('lambda must be positive');
    });

    it('should return error for negative burstRate in burst distribution', () => {
      const errors = validateDistributionConfig({ type: 'burst', burstRate: -5, baseRate: 1 });
      expect(errors).toContain('burstRate must be non-negative');
    });

    it('should return error for negative baseRate in burst distribution', () => {
      const errors = validateDistributionConfig({ type: 'burst', burstRate: 10, baseRate: -1 });
      expect(errors).toContain('baseRate must be non-negative');
    });

    it('should return multiple errors when multiple validations fail', () => {
      const errors = validateDistributionConfig({
        type: 'linear',
        minRate: -1,
        maxRate: -2,
      });
      expect(errors.length).toBe(3);
      expect(errors).toContain('minRate must be non-negative');
      expect(errors).toContain('maxRate must be non-negative');
      expect(errors).toContain('minRate must be less than or equal to maxRate');
    });
  });
});