import { calculateTimeRange } from '../../services/syntheticRunner/utils/timeRangeCalculator';

describe('timeRangeCalculator', () => {
  describe('calculateTimeRange', () => {
    describe('with no distribution dates', () => {
      it('should use requested mode and default values', () => {
        const result = calculateTimeRange({}, 'realtime', undefined);

        expect(result.effectiveMode).toBe('realtime');
        expect(result.totalExpected).toBe(600); // 10 * 60
        expect(result.effectiveTimeRange).toBeUndefined();
        expect(result.waitMs).toBeUndefined();
      });

      it('should use custom rate and duration', () => {
        const result = calculateTimeRange({ rate: 20, duration: 120 }, 'realtime', undefined);

        expect(result.totalExpected).toBe(2400); // 20 * 120
      });

      it('should use requested time range in historical mode', () => {
        const timeRange = {
          start: new Date('2026-03-28T10:00:00Z'),
          end: new Date('2026-03-28T11:00:00Z'),
        };
        const result = calculateTimeRange({}, 'historical', timeRange);

        expect(result.effectiveMode).toBe('historical');
        expect(result.totalExpected).toBe(36000); // 3600 seconds * 10 rate
      });
    });

    describe('with distribution startDate and endDate in the past', () => {
      it('should detect historical mode', () => {
        const distribution = {
          startDate: '2026-03-27T10:00:00Z',
          endDate: '2026-03-27T12:00:00Z',
          rate: 10,
        };
        const result = calculateTimeRange(distribution, 'realtime', undefined);

        expect(result.effectiveMode).toBe('historical');
        expect(result.effectiveTimeRange).toBeDefined();
        expect(result.totalExpected).toBe(72000); // 7200 seconds * 10
      });
    });

    describe('with distribution startDate in the future', () => {
      it('should calculate wait time', () => {
        const futureDate = new Date(Date.now() + 60000);
        const distribution = {
          startDate: futureDate.toISOString(),
          endDate: new Date(Date.now() + 120000).toISOString(),
          rate: 10,
        };
        const result = calculateTimeRange(distribution, 'realtime', undefined);

        expect(result.effectiveMode).toBe('realtime');
        expect(result.waitMs).toBeGreaterThan(50000); // At least 50 seconds in future
      });
    });

    describe('with distribution spanning current time', () => {
      it('should detect realtime mode', () => {
        const pastStart = new Date(Date.now() - 60000);
        const futureEnd = new Date(Date.now() + 60000);
        const distribution = {
          startDate: pastStart.toISOString(),
          endDate: futureEnd.toISOString(),
          rate: 10,
        };
        const result = calculateTimeRange(distribution, 'realtime', undefined);

        expect(result.effectiveMode).toBe('realtime');
        expect(result.effectiveTimeRange).toBeDefined();
      });
    });

    describe('edge cases', () => {
      it('should use default duration when duration is 0 (falsy)', () => {
        const result = calculateTimeRange({ duration: 0 }, 'realtime', undefined);
        expect(result.totalExpected).toBe(600); // 0 is falsy, defaults to 60
      });

      it('should handle undefined rate (use default)', () => {
        const result = calculateTimeRange({}, 'realtime', undefined);
        expect(result.totalExpected).toBe(600); // default rate of 10 * default duration of 60
      });

      it('should throw error when historical mode is requested without timeRange', () => {
        expect(() => calculateTimeRange({}, 'historical', undefined)).toThrow(
          'Historical mode requires a time range'
        );
      });

      it('should throw error when historical mode is requested with null timeRange', () => {
        expect(() => calculateTimeRange({}, 'historical', null as any)).toThrow(
          'Historical mode requires a time range'
        );
      });

      it('should not throw for realtime mode without timeRange', () => {
        expect(() => calculateTimeRange({}, 'realtime', undefined)).not.toThrow();
      });
    });
  });
});