import { calculateRatePreview } from '../../services/syntheticRunner/utils/rateCalculator';
import { 
  FixedConfig, 
  UniformConfig, 
  GaussianConfig, 
  LinearRampConfig, 
  ExponentialRampConfig,
  SineWaveConfig,
  SquareWaveConfig,
  TriangleWaveConfig,
  BurstConfig,
  PoissonConfig,
  ExponentialConfig,
  DistributionConfig
} from '../../models/scenario/interfaces';

describe('calculateRatePreview', () => {
  const defaultDuration = 60;
  const defaultSamples = 60;

  describe('fixed', () => {
    it('should return constant rate', () => {
      const config: FixedConfig = { type: 'fixed', rate: 10 };
      const result = calculateRatePreview(config, 10, 10);
      
      expect(result.length).toBe(11);
      result.forEach(point => {
        expect(point.rate).toBe(10);
      });
    });

    it('should use default rate when not provided', () => {
      const config: FixedConfig = { type: 'fixed' };
      const result = calculateRatePreview(config, 10, 10);
      
      result.forEach(point => {
        expect(point.rate).toBe(10);
      });
    });
  });

  describe('uniform', () => {
    it('should return rates between min and max', () => {
      const config: UniformConfig = { type: 'uniform', min: 5, max: 15 };
      const result = calculateRatePreview(config, 10, 100);
      
      result.forEach(point => {
        expect(point.rate).toBeGreaterThanOrEqual(5);
        expect(point.rate).toBeLessThanOrEqual(15);
      });
    });
  });

  describe('gaussian', () => {
    it('should return rates around mean', () => {
      const config: GaussianConfig = { type: 'gaussian', mean: 10, stdDev: 2 };
      const result = calculateRatePreview(config, 10, 100);
      
      const avg = result.reduce((sum, p) => sum + p.rate, 0) / result.length;
      expect(avg).toBeCloseTo(10, 0);
    });
  });

  describe('linearRamp', () => {
    it('should ramp from start to end over duration', () => {
      const config: LinearRampConfig = { type: 'linearRamp', start: 5, end: 30, duration: 1 };
      const result = calculateRatePreview(config, 10, 10);
      
      expect(result[0].rate).toBeCloseTo(5, 0);
      expect(result[5].rate).toBeGreaterThan(15);
      expect(result[5].rate).toBeLessThan(20);
      expect(result[10].rate).toBeCloseTo(30, 0);
    });

    it('should stay at end rate after ramp duration', () => {
      const config: LinearRampConfig = { type: 'linearRamp', start: 5, end: 30, duration: 0.5 };
      const result = calculateRatePreview(config, 10, 10);
      
      expect(result[10].rate).toBeCloseTo(30, 0);
    });
  });

  describe('exponentialRamp', () => {
    it('should grow exponentially', () => {
      const config: ExponentialRampConfig = { type: 'exponentialRamp', start: 5, growth: 1.2, duration: 1 };
      const result = calculateRatePreview(config, 10, 11);
      
      expect(result[0].rate).toBeCloseTo(5, 0);
      expect(result[10].rate).toBeGreaterThan(5);
    });

    it('should respect max cap', () => {
      const config: ExponentialRampConfig = { type: 'exponentialRamp', start: 5, growth: 2, duration: 1, max: 20 };
      const result = calculateRatePreview(config, 10, 11);
      
      result.forEach(point => {
        expect(point.rate).toBeLessThanOrEqual(20);
      });
    });
  });

  describe('sine wave', () => {
    it('should oscillate around base value', () => {
      const config: SineWaveConfig = { type: 'sine', base: 10, amplitude: 5, period: 10 };
      const result = calculateRatePreview(config, 10, 20);
      
      expect(result.length).toBe(21);
      const rates = result.map(p => p.rate);
      expect(Math.max(...rates)).toBeLessThanOrEqual(15);
      expect(Math.min(...rates)).toBeGreaterThanOrEqual(5);
    });

    it('should respect phase parameter', () => {
      const config: SineWaveConfig = { type: 'sine', base: 10, amplitude: 5, period: 10, phase: Math.PI };
      const result = calculateRatePreview(config, 10, 10);
      
      expect(result[0].rate).toBeCloseTo(10, 0);
    });
  });

  describe('square wave', () => {
    it('should alternate between min and max', () => {
      const config: SquareWaveConfig = { type: 'square', min: 5, max: 20, period: 10 };
      const result = calculateRatePreview(config, 10, 21);
      
      const uniqueRates = new Set(result.map(p => Math.round(p.rate)));
      expect(uniqueRates.size).toBeLessThanOrEqual(2);
    });
  });

  describe('triangle wave', () => {
    it('should linearly ramp up and down', () => {
      const config: TriangleWaveConfig = { type: 'triangle', min: 10, max: 50, period: 10 };
      const result = calculateRatePreview(config, 10, 21);
      
      const rates = result.map(p => p.rate);
      expect(Math.min(...rates)).toBe(10);
      expect(Math.max(...rates)).toBeGreaterThan(45);
      expect(Math.max(...rates)).toBeLessThanOrEqual(50);
    });
  });

  describe('burst', () => {
    it('should mostly stay at baseRate with occasional bursts', () => {
      const config: BurstConfig = { type: 'burst', baseRate: 5, burstRate: 50, probability: 0.1 };
      const result = calculateRatePreview(config, 10, 100);
      
      const burstCount = result.filter(p => p.rate >= 50).length;
      expect(burstCount).toBeGreaterThan(0);
    });
  });

  describe('poisson', () => {
    it('should return non-negative integers', () => {
      const config: PoissonConfig = { type: 'poisson', lambda: 10 };
      const result = calculateRatePreview(config, 10, 100);
      
      result.forEach(point => {
        expect(point.rate).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(point.rate)).toBe(true);
      });
    });
  });

  describe('exponential', () => {
    it('should return rates based on lambda', () => {
      const config: ExponentialConfig = { type: 'exponential', lambda: 10 };
      const result = calculateRatePreview(config, 10, 100);
      
      result.forEach(point => {
        expect(point.rate).toBeGreaterThan(0);
      });
      const avg = result.reduce((sum, p) => sum + p.rate, 0) / result.length;
      expect(avg).toBeGreaterThan(1);
    });
  });

  describe('undefined distribution', () => {
    it('should use default rate of 10', () => {
      const result = calculateRatePreview(undefined, 10, 10);
      
      result.forEach(point => {
        expect(point.rate).toBe(10);
      });
    });
  });

  describe('time progression', () => {
    it('should have increasing time values', () => {
      const config: FixedConfig = { type: 'fixed', rate: 10 };
      const result = calculateRatePreview(config, 10, 10);
      
      for (let i = 0; i < result.length; i++) {
        expect(result[i].time).toBe(i);
      }
    });

    it('should have correct number of samples', () => {
      const config: FixedConfig = { type: 'fixed', rate: 10 };
      
      expect(calculateRatePreview(config, 60, 60).length).toBe(61);
      expect(calculateRatePreview(config, 60, 30).length).toBe(31);
    });
  });
});

describe('calculateBaseRate', () => {
  const runner = require('../../services/syntheticRunner/runner');
  
  describe('should return correct base rate for each distribution type', () => {
    it('fixed', () => {
      const rate = runner.calculateBaseRate({ type: 'fixed', rate: 15 });
      expect(rate).toBe(15);
    });

    it('uniform', () => {
      const rate = runner.calculateBaseRate({ type: 'uniform', min: 5, max: 15 });
      expect(rate).toBe(10);
    });

    it('gaussian', () => {
      const rate = runner.calculateBaseRate({ type: 'gaussian', mean: 20, stdDev: 3 });
      expect(rate).toBe(20);
    });

    it('linearRamp', () => {
      const rate = runner.calculateBaseRate({ type: 'linearRamp', start: 10, end: 30 });
      expect(rate).toBe(20);
    });

    it('exponentialRamp', () => {
      const rate = runner.calculateBaseRate({ type: 'exponentialRamp', start: 5 });
      expect(rate).toBe(5);
    });

    it('sine', () => {
      const rate = runner.calculateBaseRate({ type: 'sine', base: 15 });
      expect(rate).toBe(15);
    });

    it('square', () => {
      const rate = runner.calculateBaseRate({ type: 'square', min: 5, max: 25 });
      expect(rate).toBe(15);
    });

    it('triangle', () => {
      const rate = runner.calculateBaseRate({ type: 'triangle', min: 10, max: 30 });
      expect(rate).toBe(20);
    });

    it('burst', () => {
      const rate = runner.calculateBaseRate({ type: 'burst', baseRate: 8 });
      expect(rate).toBe(8);
    });

    it('poisson', () => {
      const rate = runner.calculateBaseRate({ type: 'poisson', lambda: 12 });
      expect(rate).toBe(12);
    });

    it('exponential', () => {
      const rate = runner.calculateBaseRate({ type: 'exponential', lambda: 5 });
      expect(rate).toBe(5);
    });

    it('default', () => {
      const rate = runner.calculateBaseRate({});
      expect(rate).toBe(10);
    });

    it('undefined', () => {
      const rate = runner.calculateBaseRate(undefined);
      expect(rate).toBe(10);
    });
  });
});

describe('timeRangeCalculator getBaseRate', () => {
  const { calculateTimeRange } = require('../../services/syntheticRunner/utils/timeRangeCalculator');
  
  describe('should use correct rate for totalExpected calculation', () => {
    it('fixed', () => {
      const result = calculateTimeRange(
        { type: 'fixed', rate: 10, duration: 60 },
        'realtime'
      );
      expect(result.totalExpected).toBe(600);
    });

    it('uniform - uses average', () => {
      const result = calculateTimeRange(
        { type: 'uniform', min: 5, max: 15, duration: 60 },
        'realtime'
      );
      expect(result.totalExpected).toBe(600);
    });

    it('linearRamp - uses average', () => {
      const result = calculateTimeRange(
        { type: 'linearRamp', start: 10, end: 30, duration: 60 },
        'realtime'
      );
      expect(result.totalExpected).toBe(1200);
    });

    it('gaussian - uses mean', () => {
      const result = calculateTimeRange(
        { type: 'gaussian', mean: 20, stdDev: 2, duration: 60 },
        'realtime'
      );
      expect(result.totalExpected).toBe(1200);
    });
  });
});
