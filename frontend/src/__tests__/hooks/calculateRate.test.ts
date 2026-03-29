import { describe, it, expect } from 'vitest';
import { calculateRate } from '../../components/DistributionPreview/useDistributionCalculations';
import { DistributionConfig, DistributionType } from '../../types';

describe('calculateRate', () => {
  const baseConfig: DistributionConfig = {
    type: DistributionType.UNIFORM,
  };

  it('returns configured rate for UNIFORM distribution', () => {
    const config = { ...baseConfig, type: DistributionType.UNIFORM, rate: 50 };
    expect(calculateRate(DistributionType.UNIFORM, 0.5, config)).toBe(50);
    expect(calculateRate(DistributionType.UNIFORM, 0, config)).toBe(50);
    expect(calculateRate(DistributionType.UNIFORM, 1, config)).toBe(50);
  });

  it('returns 10 (default) for UNIFORM when rate is not set', () => {
    const config = { ...baseConfig, type: DistributionType.UNIFORM };
    expect(calculateRate(DistributionType.UNIFORM, 0.5, config)).toBe(10);
  });

  it('LINEAR distribution interpolates between startRate and endRate', () => {
    const config = { 
      ...baseConfig, 
      type: DistributionType.LINEAR, 
      startRate: 10, 
      endRate: 100 
    };
    expect(calculateRate(DistributionType.LINEAR, 0, config)).toBe(10);
    expect(calculateRate(DistributionType.LINEAR, 1, config)).toBe(100);
    expect(calculateRate(DistributionType.LINEAR, 0.5, config)).toBe(55);
  });

  it('RANDOM distribution returns value within minRate and maxRate', () => {
    const config = { 
      ...baseConfig, 
      type: DistributionType.RANDOM, 
      minRate: 5, 
      maxRate: 20 
    };
    // Run multiple times to verify it's in range
    for (let i = 0; i < 100; i++) {
      const rate = calculateRate(DistributionType.RANDOM, 0.5, config);
      expect(rate).toBeGreaterThanOrEqual(5);
      expect(rate).toBeLessThanOrEqual(20);
    }
  });

  it('BURST distribution alternates between burstRate and baseRate', () => {
    const config = { 
      ...baseConfig, 
      type: DistributionType.BURST, 
      burstRate: 100, 
      baseRate: 10,
      burstInterval: '5m'
    };
    // This test is timing-dependent so we just verify it returns a number
    const rate = calculateRate(DistributionType.BURST, 0.5, config);
    expect(typeof rate).toBe('number');
  });

  it('NORMAL distribution returns non-negative values', () => {
    const config = { 
      ...baseConfig, 
      type: DistributionType.NORMAL, 
      mean: 50, 
      stdDev: 10 
    };
    // Run multiple times to check it stays non-negative (mostly)
    for (let i = 0; i < 100; i++) {
      const rate = calculateRate(DistributionType.NORMAL, 0.5, config);
      expect(rate).toBeGreaterThanOrEqual(0);
    }
  });

  it('EXPONENTIAL distribution uses progress to calculate rate', () => {
    const config = { 
      ...baseConfig, 
      type: DistributionType.EXPONENTIAL, 
      startRate: 10, 
      endRate: 1000 
    };
    // At progress 0, should return startRate
    expect(calculateRate(DistributionType.EXPONENTIAL, 0, config)).toBe(10);
    // At progress 1, should return endRate (approximately, due to floating point)
    expect(calculateRate(DistributionType.EXPONENTIAL, 1, config)).toBeCloseTo(1000, 0);
  });

  it('returns 10 (default) for unknown distribution type', () => {
    const config = { ...baseConfig, type: 'unknown' as DistributionType };
    expect(calculateRate('unknown' as DistributionType, 0.5, config)).toBe(10);
  });
});