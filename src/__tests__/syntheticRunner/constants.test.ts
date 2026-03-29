import {
  OTLP_ENDPOINT,
  getDefaultRootSpan,
  createCounterMetric,
  createDefaultLog,
} from '../../services/syntheticRunner/utils/constants';

describe('constants', () => {
  describe('OTLP_ENDPOINT', () => {
    it('should have a default value', () => {
      expect(OTLP_ENDPOINT).toBeDefined();
      expect(typeof OTLP_ENDPOINT).toBe('string');
    });
  });

  describe('getDefaultRootSpan', () => {
    it('should return a valid root span configuration', () => {
      const span = getDefaultRootSpan();

      expect(span.name).toBe('root-operation');
      expect(span.kind).toBe('server');
      expect(span.statusCode).toBe('OK');
      expect(span.attributes).toEqual({});
      expect(span.events).toEqual([]);
      expect(span.links).toEqual([]);
      expect(span.childSpans).toBe(2);
      expect(span.durationMs).toBe(100);
    });

    it('should return a new object each time', () => {
      const span1 = getDefaultRootSpan();
      const span2 = getDefaultRootSpan();
      expect(span1).not.toBe(span2);
    });
  });

  describe('createCounterMetric', () => {
    it('should create a counter metric with the given name', () => {
      const metric = createCounterMetric('test.counter');

      expect(metric.name).toBe('test.counter');
      expect(metric.type).toBe('counter');
      expect(metric.value).toBe(1);
      expect(metric.unit).toBe('1');
      expect(metric.labels).toEqual({});
    });

    it('should return a new object each time', () => {
      const metric1 = createCounterMetric('test.counter');
      const metric2 = createCounterMetric('test.counter');
      expect(metric1).not.toBe(metric2);
    });
  });

  describe('createDefaultLog', () => {
    it('should create a default log record', () => {
      const log = createDefaultLog();

      expect(log.severityNumber).toBe(9);
      expect(log.severityText).toBe('Info');
      expect(log.body).toBe('Log message');
      expect(log.attributes).toEqual({});
    });

    it('should return a new object each time', () => {
      const log1 = createDefaultLog();
      const log2 = createDefaultLog();
      expect(log1).not.toBe(log2);
    });
  });
});