import { DistributionParams } from '../variables/types';

export interface DistributionConfig {
  type?: string;
  mean?: number;
  stdDev?: number;
  minRate?: number;
  maxRate?: number;
  burstInterval?: string;
  burstRate?: number;
  baseRate?: number;
  lambda?: number;
}

export function applyDistribution(baseValue: number, distribution?: DistributionConfig): number {
  if (!distribution || !distribution.type) return baseValue;

  switch (distribution.type) {
    case 'uniform':
      return baseValue;
    case 'normal':
    case 'gaussian': {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return Math.max(0, baseValue + (distribution.stdDev || 10) * z);
    }
    case 'linear': {
      const min = distribution.minRate || 0.5;
      const max = distribution.maxRate || 1.5;
      return baseValue * (min + Math.random() * (max - min));
    }
    case 'exponential':
      return -baseValue * Math.log(Math.random());
    case 'poisson':
      return baseValue * Math.max(0, Math.round(-Math.log(Math.random()) / (distribution.lambda || 1)));
    case 'burst': {
      const burstRate = distribution.burstRate || 10;
      const baseRate = distribution.baseRate || 1;
      return Math.random() > 0.9 ? baseValue * burstRate : baseValue * baseRate;
    }
    case 'random': {
      const min = distribution.minRate || 0.1;
      const max = distribution.maxRate || 2;
      return baseValue * (min + Math.random() * (max - min));
    }
    default:
      return baseValue;
  }
}

export function resolveDistribution(config?: DistributionConfig): DistributionParams | undefined {
  if (!config) return undefined;
  
  return {
    type: config.type as DistributionParams['type'],
    mean: config.mean,
    stdDev: config.stdDev,
    minRate: config.minRate,
    maxRate: config.maxRate,
    burstInterval: config.burstInterval,
    burstRate: config.burstRate,
    baseRate: config.baseRate,
    lambda: config.lambda,
  };
}

export function getDistributionStats(type: string): { description: string; params: string[] } {
  switch (type) {
    case 'uniform':
      return { description: 'Constant value', params: [] };
    case 'normal':
    case 'gaussian':
      return { description: 'Bell curve around mean', params: ['mean', 'stdDev'] };
    case 'linear':
      return { description: 'Linear ramp', params: ['minRate', 'maxRate'] };
    case 'exponential':
      return { description: 'Exponential decay', params: ['lambda'] };
    case 'poisson':
      return { description: 'Poisson distribution', params: ['lambda'] };
    case 'burst':
      return { description: 'Occasional spikes', params: ['burstRate', 'baseRate'] };
    case 'random':
      return { description: 'Random multiplier', params: ['minRate', 'maxRate'] };
    default:
      return { description: 'Unknown', params: [] };
  }
}

export function validateDistributionConfig(config: DistributionConfig): string[] {
  const errors: string[] = [];

  if (config.type === 'normal' || config.type === 'gaussian') {
    if (config.stdDev !== undefined && config.stdDev < 0) {
      errors.push('stdDev must be non-negative');
    }
  }

  if (config.type === 'linear' || config.type === 'random') {
    if (config.minRate !== undefined && config.minRate < 0) {
      errors.push('minRate must be non-negative');
    }
    if (config.maxRate !== undefined && config.maxRate < 0) {
      errors.push('maxRate must be non-negative');
    }
    if (config.minRate !== undefined && config.maxRate !== undefined && config.minRate > config.maxRate) {
      errors.push('minRate must be less than or equal to maxRate');
    }
  }

  if (config.type === 'exponential' || config.type === 'poisson') {
    if (config.lambda !== undefined && config.lambda <= 0) {
      errors.push('lambda must be positive');
    }
  }

  if (config.type === 'burst') {
    if (config.burstRate !== undefined && config.burstRate < 0) {
      errors.push('burstRate must be non-negative');
    }
    if (config.baseRate !== undefined && config.baseRate < 0) {
      errors.push('baseRate must be non-negative');
    }
  }

  return errors;
}
