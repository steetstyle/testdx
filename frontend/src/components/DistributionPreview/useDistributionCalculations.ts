import { useMemo } from 'react';
import {
  DistributionConfig,
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
  FixedConfig,
} from '../../types';

const linearRamp = (start: number, end: number, elapsedMs: number, totalMs: number): number => {
  const progress = Math.min(1, elapsedMs / totalMs);
  return start + (end - start) * progress;
};

const exponentialRamp = (start: number, growth: number, elapsedMs: number, totalMs: number, max?: number): number => {
  const progress = Math.min(1, elapsedMs / totalMs);
  const value = start * Math.pow(growth, progress * 10);
  return max ? Math.min(value, max) : value;
};

const sineWave = (mean: number, amplitude: number, periodMs: number, elapsedMs: number, phase: number = 0): number => {
  const angularFrequency = (2 * Math.PI) / periodMs;
  return mean + amplitude * Math.sin(angularFrequency * elapsedMs + phase);
};

const squareWave = (min: number, max: number, periodMs: number, elapsedMs: number): number => {
  const halfPeriod = periodMs / 2;
  return (elapsedMs % periodMs) < halfPeriod ? max : min;
};

const triangleWave = (min: number, max: number, periodMs: number, elapsedMs: number): number => {
  const t = (elapsedMs % periodMs) / periodMs;
  if (t < 0.5) {
    return min + (max - min) * 2 * t;
  }
  return max - (max - min) * 2 * (t - 0.5);
};

const gaussian = (mean: number, stdDev: number): number => {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + stdDev * z;
};

const uniform = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

const poisson = (lambda: number): number => {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
};

const exponential = (lambda: number): number => {
  return -Math.log(Math.random()) / lambda;
};

const calculateRateAtTime = (
  config: DistributionConfig,
  elapsedMs: number,
  totalMs: number
): number => {
  switch (config.type) {
    case 'fixed':
      return (config as FixedConfig).rate ?? 10;

    case 'uniform':
      return uniform((config as UniformConfig).min ?? 1, (config as UniformConfig).max ?? 10);

    case 'gaussian':
      return gaussian((config as GaussianConfig).mean ?? 10, (config as GaussianConfig).stdDev ?? 2);

    case 'linearRamp': {
      const c = config as LinearRampConfig;
      return linearRamp(c.start ?? 5, c.end ?? 20, elapsedMs, (c.duration ?? 1) * totalMs);
    }

    case 'exponentialRamp': {
      const c = config as ExponentialRampConfig;
      return exponentialRamp(c.start ?? 5, c.growth ?? 1.1, elapsedMs, (c.duration ?? 1) * totalMs, c.max);
    }

    case 'sine': {
      const c = config as SineWaveConfig;
      return sineWave(c.base ?? 10, c.amplitude ?? 5, (c.period ?? 10) * 1000, elapsedMs, c.phase ?? 0);
    }

    case 'square': {
      const c = config as SquareWaveConfig;
      return squareWave(c.min ?? 5, c.max ?? 20, (c.period ?? 10) * 1000, elapsedMs);
    }

    case 'triangle': {
      const c = config as TriangleWaveConfig;
      return triangleWave(c.min ?? 5, c.max ?? 20, (c.period ?? 10) * 1000, elapsedMs);
    }

    case 'burst': {
      const c = config as BurstConfig;
      const prob = c.probability ?? 0.1;
      return Math.random() > (1 - prob) ? (c.burstRate ?? 50) : (c.baseRate ?? 5);
    }

    case 'poisson':
      return poisson((config as PoissonConfig).lambda ?? 10);

    case 'exponential':
      return exponential((config as ExponentialConfig).lambda ?? 1);

    default:
      return 10;
  }
};

export interface ChartDataPoint {
  point: number;
  progress: number;
  rate: number;
}

export function useDistributionChartData(distribution: DistributionConfig, samples: number): ChartDataPoint[] {
  return useMemo(() => {
    const data: ChartDataPoint[] = [];
    const duration = (distribution as any).duration || 60;
    const totalMs = duration * 1000;
    
    for (let i = 0; i <= samples; i++) {
      const progress = i / samples;
      const elapsedMs = progress * totalMs;
      const rate = calculateRateAtTime(distribution, elapsedMs, totalMs);
      data.push({
        point: i,
        progress: Math.round(progress * 100),
        rate: Math.round(rate * 10) / 10,
      });
    }
    return data;
  }, [distribution, samples]);
}
