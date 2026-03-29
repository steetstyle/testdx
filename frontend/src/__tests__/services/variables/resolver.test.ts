import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VariableResolver } from '../../../services/variables/resolver';
import type { GlobalVariables, ScenarioVariables, DistributionParams } from '../../../services/variables/types';

describe('VariableResolver (Frontend)', () => {
  let resolver: VariableResolver;

  beforeEach(() => {
    vi.useFakeTimers();
    resolver = new VariableResolver();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Constructor', () => {
    it('creates instance with default values', () => {
      const resolver = new VariableResolver();
      expect(resolver).toBeDefined();
    });

    it('creates instance with custom variables', () => {
      const globalVars: GlobalVariables = { env: 'production' };
      const scenarioVars: ScenarioVariables = { userId: 123 };
      const dist: DistributionParams = { type: 'gaussian', mean: 100, stdDev: 15 };
      
      const resolver = new VariableResolver(globalVars, scenarioVars, dist);
      expect(resolver).toBeDefined();
    });
  });

  describe('UUID Generation', () => {
    it('generates valid UUID', () => {
      const uuid = resolver.uuid();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('generates unique UUIDs', () => {
      const uuid1 = resolver.uuid();
      const uuid2 = resolver.uuid();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('TraceId Generation', () => {
    it('generates 32 hex character string', () => {
      const traceId = resolver.traceId();
      expect(traceId).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe('SpanId Generation', () => {
    it('generates 16 hex character string', () => {
      const spanId = resolver.spanId();
      expect(spanId).toMatch(/^[a-f0-9]{16}$/);
    });
  });

  describe('Timestamp Generation', () => {
    it('generates unix timestamp', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const ts = resolver.unixTimestamp();
      expect(ts).toBe(1704067200000);
    });

    it('generates ISO timestamp', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const ts = resolver.isoTimestamp();
      expect(ts).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('Counter Functions', () => {
    it('increments counter', () => {
      expect(resolver.incrementCounter()).toBe(1);
      expect(resolver.incrementCounter()).toBe(2);
    });

    it('increments iteration', () => {
      resolver.incrementIteration();
      resolver.incrementIteration();
      resolver.incrementIteration();
    });

    it('resets counters', () => {
      resolver.incrementCounter();
      resolver.incrementCounter();
      resolver.resetCounters();
      expect(resolver.incrementCounter()).toBe(1);
    });
  });

  describe('Random Functions', () => {
    it('generates randomInt within range', () => {
      const values = Array.from({ length: 100 }, () => resolver.randomInt(['1', '10']));
      expect(values.every(v => v >= 1 && v <= 10)).toBe(true);
    });

    it('generates randomFloat within range', () => {
      const values = Array.from({ length: 100 }, () => resolver.randomFloat(['0.5', '1.5']));
      expect(values.every(v => v >= 0.5 && v < 1.5)).toBe(true);
    });

    it('generates randomChoice from options', () => {
      const options = ['a', 'b', 'c'];
      const values = Array.from({ length: 100 }, () => resolver.randomChoice(options));
      expect(values.every(v => options.includes(v))).toBe(true);
    });

    it('generates randomBool', () => {
      const values = Array.from({ length: 100 }, () => resolver.randomBool());
      const hasTrue = values.some(v => v === true);
      const hasFalse = values.some(v => v === false);
      expect(hasTrue && hasFalse).toBe(true);
    });
  });

  describe('Name Generation', () => {
    it('generates firstName', () => {
      const name = resolver.firstName();
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });

    it('generates lastName', () => {
      const name = resolver.lastName();
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });

    it('generates randomName', () => {
      const name = resolver.randomName();
      expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    });

    it('generates randomEmail', () => {
      const email = resolver.randomEmail();
      expect(email).toMatch(/^[a-z]+\.[a-z]+@[a-z]+\.[a-z]+$/);
    });
  });

  describe('Distribution Functions', () => {
    beforeEach(() => {
      resolver = new VariableResolver({}, {}, { type: 'gaussian', mean: 100, stdDev: 10 });
    });

    it('generates gaussian distribution', () => {
      const values = Array.from({ length: 100 }, () => resolver.gaussian(100, 10));
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      expect(mean).toBeGreaterThan(85);
      expect(mean).toBeLessThan(115);
    });

    it('generates uniform distribution', () => {
      const values = Array.from({ length: 100 }, () => resolver.uniform(5, 10));
      expect(values.every(v => v >= 5 && v < 10)).toBe(true);
    });

    it('generates linear distribution', () => {
      resolver.incrementIteration();
      const value = resolver.linear(1, 10);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(10);
    });

    it('generates exponential distribution', () => {
      const values = Array.from({ length: 100 }, () => resolver.exponential(0.5));
      expect(values.every(v => v > 0)).toBe(true);
    });

    it('generates poisson distribution', () => {
      const values = Array.from({ length: 100 }, () => resolver.poisson(10));
      expect(values.every(v => Number.isInteger(v) && v >= 0)).toBe(true);
    });

    it('generates burst distribution', () => {
      const values = Array.from({ length: 100 }, () => resolver.burst());
      const uniqueValues = [...new Set(values)];
      expect(uniqueValues.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Value Resolution', () => {
    it('resolves plain string unchanged', () => {
      const result = resolver.resolveValue('plain-string');
      expect(result).toBe('plain-string');
    });

    it('resolves number unchanged', () => {
      const result = resolver.resolveValue(42);
      expect(result).toBe(42);
    });

    it('resolves boolean unchanged', () => {
      const result = resolver.resolveValue(true);
      expect(result).toBe(true);
    });

    it('resolves variable reference from global variables', () => {
      resolver = new VariableResolver({ baseUrl: 'https://api.example.com' }, {}, { type: 'uniform' });
      const result = resolver.resolveValue('${baseUrl}');
      expect(result).toBe('https://api.example.com');
    });

    it('resolves variable reference from scenario variables', () => {
      resolver = new VariableResolver({}, { userId: 'user-123' }, { type: 'uniform' });
      const result = resolver.resolveValue('${userId}');
      expect(result).toBe('user-123');
    });

    it('resolves uuid function', () => {
      resolver = new VariableResolver({}, {}, { type: 'uniform' });
      const result = resolver.resolveValue('${uuid}');
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('resolves embedded expressions', () => {
      resolver = new VariableResolver({}, {}, { type: 'uniform' });
      const result = resolver.resolveValue('${firstName}.${lastName}@example.com');
      expect(result).toMatch(/^[A-Z][a-z]+\.[A-Z][a-z]+@example\.com$/);
    });
  });

  describe('Attribute Resolution', () => {
    it('resolves all attributes', () => {
      resolver = new VariableResolver({}, {}, { type: 'gaussian', mean: 100, stdDev: 10 });
      const attrs = {
        'user.id': '${uuid}',
        'user.name': '${randomName}',
        'http.duration_ms': '${gaussian}',
      };
      const resolved = resolver.resolveAttributes(attrs);
      expect(resolved['user.id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(resolved['user.name']).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
      expect(typeof resolved['http.duration_ms']).toBe('number');
    });

    it('keeps non-expression values unchanged', () => {
      const attrs = {
        'static.attr': 'value',
        'numeric.attr': 123,
        'boolean.attr': true,
      };
      const resolved = resolver.resolveAttributes(attrs);
      expect(resolved).toEqual(attrs);
    });
  });

  describe('Context Update', () => {
    it('updates global variables', () => {
      resolver.updateContext({ env: 'production' }, {}, { type: 'uniform' });
      expect(resolver.resolveValue('${env}')).toBe('production');
    });

    it('updates scenario variables', () => {
      resolver.updateContext({}, { sessionId: 'abc123' }, { type: 'uniform' });
      expect(resolver.resolveValue('${sessionId}')).toBe('abc123');
    });

    it('updates distribution', () => {
      resolver.updateContext({}, {}, { type: 'gaussian', mean: 200, stdDev: 25 });
      expect(resolver.resolveDistribution({ type: 'gaussian', mean: 200, stdDev: 25 })).toEqual({
        type: 'gaussian',
        mean: 200,
        stdDev: 25,
      });
    });
  });

  describe('Distribution Resolution', () => {
    it('resolves string mean to number', () => {
      resolver.updateContext({ meanVal: '150' }, {}, { type: 'gaussian', mean: '${meanVal}' as any, stdDev: 20 });
      const dist = resolver.resolveDistribution({ type: 'gaussian', mean: '${meanVal}' as any, stdDev: 20 });
      expect(dist.mean).toBe(150);
    });

    it('resolves string stdDev to number', () => {
      resolver.updateContext({ stdDevVal: '25' }, {}, { type: 'gaussian', mean: 100, stdDev: '${stdDevVal}' as any });
      const dist = resolver.resolveDistribution({ type: 'gaussian', mean: 100, stdDev: '${stdDevVal}' as any });
      expect(dist.stdDev).toBe(25);
    });
  });
});