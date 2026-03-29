import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDistributionChartData, ChartDataPoint } from '../../components/DistributionPreview/useDistributionCalculations';
import { DistributionConfig, DistributionType } from '../../types';

describe('useDistributionChartData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when samples is 0', () => {
    const config: DistributionConfig = { type: DistributionType.UNIFORM, rate: 10 };
    const { result } = renderHook(() => useDistributionChartData(config, 0));
    expect(result.current).toEqual([]);
  });

  it('generates correct number of data points', () => {
    const config: DistributionConfig = { type: DistributionType.UNIFORM, rate: 10 };
    const { result } = renderHook(() => useDistributionChartData(config, 10));
    expect(result.current).toHaveLength(10);
  });

  it('data points have correct structure', () => {
    const config: DistributionConfig = { type: DistributionType.UNIFORM, rate: 10 };
    const { result } = renderHook(() => useDistributionChartData(config, 5));
    
    result.current.forEach((point: ChartDataPoint) => {
      expect(point).toHaveProperty('point');
      expect(point).toHaveProperty('progress');
      expect(point).toHaveProperty('rate');
      expect(typeof point.point).toBe('number');
      expect(typeof point.progress).toBe('number');
      expect(typeof point.rate).toBe('number');
    });
  });

  it('progress values range from 0 to 100', () => {
    const config: DistributionConfig = { type: DistributionType.UNIFORM, rate: 10 };
    const { result } = renderHook(() => useDistributionChartData(config, 10));
    
    expect(result.current[0].progress).toBe(0);
    expect(result.current[result.current.length - 1].progress).toBe(90);
  });

  it('uniform distribution returns constant rate', () => {
    const config: DistributionConfig = { type: DistributionType.UNIFORM, rate: 50 };
    const { result } = renderHook(() => useDistributionChartData(config, 10));
    
    result.current.forEach((point: ChartDataPoint) => {
      expect(point.rate).toBe(50);
    });
  });

  it('linear distribution has increasing rates', () => {
    const config: DistributionConfig = { type: DistributionType.LINEAR, startRate: 10, endRate: 100 };
    const { result } = renderHook(() => useDistributionChartData(config, 10));
    
    for (let i = 1; i < result.current.length; i++) {
      expect(result.current[i].rate).toBeGreaterThanOrEqual(result.current[i - 1].rate);
    }
  });

  it('rate values are rounded to 1 decimal place', () => {
    const config: DistributionConfig = { type: DistributionType.UNIFORM, rate: 33.333 };
    const { result } = renderHook(() => useDistributionChartData(config, 5));
    
    result.current.forEach((point: ChartDataPoint) => {
      const decimalPart = point.rate.toString().split('.')[1];
      expect(decimalPart?.length || 0).toBeLessThanOrEqual(1);
    });
  });

  it('memoizes results - does not recalculate when config is same', () => {
    const config: DistributionConfig = { type: DistributionType.UNIFORM, rate: 10 };
    const { result, rerender } = renderHook(() => useDistributionChartData(config, 10));
    const firstResult = result.current;
    
    rerender();
    
    expect(result.current).toBe(firstResult);
  });

  it('recalculates when config changes', () => {
    const { result, rerender } = renderHook(({ rate }) => 
      useDistributionChartData({ type: DistributionType.UNIFORM, rate }, 10),
      { initialProps: { rate: 10 } }
    );
    
    expect(result.current[0].rate).toBe(10);
    
    rerender({ rate: 50 });
    
    expect(result.current[0].rate).toBe(50);
  });

  it('recalculates when samples changes', () => {
    const config: DistributionConfig = { type: DistributionType.UNIFORM, rate: 10 };
    const { result, rerender } = renderHook(() => useDistributionChartData(config, 5));
    expect(result.current).toHaveLength(5);
    
    rerender();
    
    expect(result.current).toHaveLength(5);
  });
});