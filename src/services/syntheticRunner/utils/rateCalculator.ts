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
} from '../../../models/scenario/interfaces';

export interface RatePreviewPoint {
  time: number;
  rate: number;
}

export function calculateRatePreview(
  distribution: DistributionConfig | undefined,
  scenarioDuration: number = 60,
  sampleCount: number = 60
): RatePreviewPoint[] {
  const points: RatePreviewPoint[] = [];
  const durationMs = scenarioDuration * 1000;
  const sampleIntervalMs = durationMs / sampleCount;

  const defaultRate = distribution?.type === 'fixed' ? (distribution as FixedConfig).rate ?? 10 : 10;

  for (let i = 0; i <= sampleCount; i++) {
    const elapsedMs = i * sampleIntervalMs;
    const rate = calculateRateAtTime(distribution, defaultRate, elapsedMs, durationMs);
    points.push({
      time: Math.round(elapsedMs / 1000),
      rate: Math.round(rate * 10) / 10,
    });
  }

  return points;
}

function calculateRateAtTime(
  distribution: DistributionConfig | undefined,
  defaultRate: number,
  elapsedMs: number,
  totalMs: number
): number {
  if (!distribution) {
    return defaultRate;
  }

  switch (distribution.type) {
    case 'fixed':
      return distribution.rate ?? defaultRate;

    case 'uniform':
      return uniform(distribution.min, distribution.max);

    case 'gaussian':
      return gaussian(distribution.mean, distribution.stdDev);

    case 'linearRamp':
      return linearRamp(
        distribution.start,
        distribution.end,
        elapsedMs,
        distribution.duration * totalMs
      );

    case 'exponentialRamp':
      return exponentialRamp(
        distribution.start,
        distribution.growth,
        elapsedMs,
        distribution.duration * totalMs,
        distribution.max
      );

    case 'sine':
      return sineWave(
        distribution.base,
        distribution.amplitude,
        distribution.period * 1000,
        elapsedMs,
        distribution.phase ?? 0
      );

    case 'square':
      return squareWave(
        distribution.min,
        distribution.max,
        distribution.period * 1000,
        elapsedMs
      );

    case 'triangle':
      return triangleWave(
        distribution.min,
        distribution.max,
        distribution.period * 1000,
        elapsedMs
      );

    case 'burst':
      const prob = distribution.probability ?? 0.1;
      return Math.random() > (1 - prob) ? distribution.burstRate : distribution.baseRate;

    case 'poisson':
      return poisson(distribution.lambda);

    case 'exponential': {
      const lambda = distribution.lambda ?? 1;
      const interval = exponential(lambda);
      return interval > 0 ? 1 / interval : lambda;
    }

    default:
      return defaultRate;
  }
}

function linearRamp(start: number, end: number, elapsedMs: number, totalMs: number): number {
  const progress = Math.min(1, elapsedMs / totalMs);
  return start + (end - start) * progress;
}

function exponentialRamp(start: number, growth: number, elapsedMs: number, totalMs: number, max?: number): number {
  const progress = Math.min(1, elapsedMs / totalMs);
  const value = start * Math.pow(growth, progress * 10);
  return max ? Math.min(value, max) : value;
}

function sineWave(mean: number, amplitude: number, periodMs: number, elapsedMs: number, phase: number = 0): number {
  const angularFrequency = (2 * Math.PI) / periodMs;
  return mean + amplitude * Math.sin(angularFrequency * elapsedMs + phase);
}

function squareWave(min: number, max: number, periodMs: number, elapsedMs: number): number {
  const halfPeriod = periodMs / 2;
  return (elapsedMs % periodMs) < halfPeriod ? max : min;
}

function triangleWave(min: number, max: number, periodMs: number, elapsedMs: number): number {
  const t = (elapsedMs % periodMs) / periodMs;
  if (t < 0.5) {
    return min + (max - min) * 2 * t;
  }
  return max - (max - min) * 2 * (t - 0.5);
}

function gaussian(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + stdDev * z0;
}

function uniform(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function poisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function exponential(lambda: number): number {
  return -Math.log(Math.random()) / lambda;
}
