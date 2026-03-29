export interface TimeRangeResult {
  effectiveMode: 'realtime' | 'historical';
  effectiveTimeRange?: { start: Date; end: Date };
  totalExpected: number;
  waitMs?: number;
}

interface DistributionConfig {
  startDate?: string;
  endDate?: string;
  rate?: number;
  duration?: number;
  type?: string;
  min?: number;
  max?: number;
  mean?: number;
  start?: number;
  end?: number;
  base?: number;
  baseRate?: number;
  lambda?: number;
}

function getBaseRate(distribution: DistributionConfig): number {
  if (!distribution) return 10;
  
  switch (distribution.type) {
    case 'fixed':
      return distribution.rate ?? 10;
    case 'uniform':
      return ((distribution.min ?? 1) + (distribution.max ?? 10)) / 2;
    case 'gaussian':
      return distribution.mean ?? 10;
    case 'linearRamp':
    case 'exponentialRamp':
      return ((distribution.start ?? 5) + (distribution.end ?? 20)) / 2;
    case 'sine':
      return distribution.base ?? 10;
    case 'square':
    case 'triangle':
      return ((distribution.min ?? 5) + (distribution.max ?? 20)) / 2;
    case 'burst':
      return distribution.baseRate ?? 5;
    case 'poisson':
    case 'exponential':
      return distribution.lambda ?? 10;
    default:
      return distribution.rate ?? 10;
  }
}

export function calculateTimeRange(
  distribution: DistributionConfig,
  requestedMode: 'realtime' | 'historical',
  requestedTimeRange?: { start: Date; end: Date }
): TimeRangeResult {
  const rate = getBaseRate(distribution);
  const duration = distribution?.duration || 60;
  const now = new Date();

  if (distribution?.startDate && distribution?.endDate && requestedMode === 'historical') {
    const startDate = new Date(distribution.startDate);
    const endDate = new Date(distribution.endDate);
    const effectiveTimeRange = { start: startDate, end: endDate };

    if (endDate < now) {
      const totalExpected = Math.ceil((endDate.getTime() - startDate.getTime()) / 1000) * rate;
      return {
        effectiveMode: 'historical',
        effectiveTimeRange,
        totalExpected,
      };
    } else if (startDate > now) {
      const waitMs = startDate.getTime() - now.getTime();
      return {
        effectiveMode: 'historical',
        effectiveTimeRange,
        totalExpected: duration * rate,
        waitMs,
      };
    } else {
      return {
        effectiveMode: 'historical',
        effectiveTimeRange,
        totalExpected: duration * rate,
      };
    }
  }

  if (requestedMode === 'historical' && requestedTimeRange) {
    const totalExpected = Math.ceil((requestedTimeRange.end.getTime() - requestedTimeRange.start.getTime()) / 1000) * rate;
    return {
      effectiveMode: 'historical',
      effectiveTimeRange: requestedTimeRange,
      totalExpected,
    };
  }

  if (requestedMode === 'historical' && !requestedTimeRange) {
    throw new Error('Historical mode requires a time range (startDate and endDate in distribution, or requestedTimeRange parameter)');
  }

  return {
    effectiveMode: 'realtime',
    effectiveTimeRange: requestedTimeRange,
    totalExpected: duration * rate,
  };
}
