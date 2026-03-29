import { describe, it, expect } from 'vitest';
import { parseInterval } from '../../components/DistributionPreview/useDistributionCalculations';

describe('parseInterval', () => {
  it('returns 1000 for undefined input', () => {
    expect(parseInterval(undefined)).toBe(1000);
  });

  it('parses milliseconds correctly', () => {
    expect(parseInterval('500ms')).toBe(500);
    expect(parseInterval('100ms')).toBe(100);
  });

  it('parses seconds correctly', () => {
    expect(parseInterval('1s')).toBe(1000);
    expect(parseInterval('5s')).toBe(5000);
    expect(parseInterval('60s')).toBe(60000);
  });

  it('parses minutes correctly', () => {
    expect(parseInterval('1m')).toBe(60000);
    expect(parseInterval('5m')).toBe(300000);
    expect(parseInterval('30m')).toBe(1800000);
  });

  it('parses hours correctly', () => {
    expect(parseInterval('1h')).toBe(3600000);
    expect(parseInterval('2h')).toBe(7200000);
  });

  it('returns 1000 for invalid input', () => {
    expect(parseInterval('invalid')).toBe(1000);
    expect(parseInterval('abc123')).toBe(1000);
    expect(parseInterval('')).toBe(1000);
  });
});