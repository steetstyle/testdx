import { VariableResolver } from '../services/variables/resolver';
import { GlobalVariables, ScenarioVariables, DistributionParams } from '../services/variables/types';

describe('VariableResolver', () => {
  let resolver: VariableResolver;

  beforeEach(() => {
    resolver = new VariableResolver();
  });

  describe('Basic Functions', () => {
    it('should generate UUID', () => {
      const uuid = resolver.uuid();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = resolver.uuid();
      const uuid2 = resolver.uuid();
      expect(uuid1).not.toBe(uuid2);
    });

    it('should generate traceId (32 hex chars)', () => {
      const traceId = resolver.traceId();
      expect(traceId).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should generate spanId (16 hex chars)', () => {
      const spanId = resolver.spanId();
      expect(spanId).toMatch(/^[a-f0-9]{16}$/);
    });

    it('should generate unixTimestamp', () => {
      const ts = resolver.unixTimestamp();
      expect(typeof ts).toBe('number');
      expect(ts).toBeGreaterThan(0);
    });

    it('should generate isoTimestamp', () => {
      const ts = resolver.isoTimestamp();
      expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should increment counter', () => {
      const c1 = resolver.incrementCounter();
      const c2 = resolver.incrementCounter();
      expect(c2).toBe(c1 + 1);
    });
  });

  describe('Random Functions', () => {
    it('should generate randomInt with args', () => {
      const value = resolver.randomInt(['10', '20']);
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(20);
    });

    it('should generate randomInt without args', () => {
      const value = resolver.randomInt([]);
      expect(typeof value).toBe('number');
    });

    it('should generate randomFloat with args', () => {
      const value = resolver.randomFloat(['0.5', '1.5']);
      expect(value).toBeGreaterThanOrEqual(0.5);
      expect(value).toBeLessThan(1.5);
    });

    it('should generate randomChoice', () => {
      const value = resolver.randomChoice(['a', 'b', 'c']);
      expect(['a', 'b', 'c']).toContain(value);
    });

    it('should generate firstName', () => {
      const name = resolver.firstName();
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });

    it('should generate lastName', () => {
      const name = resolver.lastName();
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });

    it('should generate randomName', () => {
      const name = resolver.randomName();
      expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    });

    it('should generate randomEmail', () => {
      const email = resolver.randomEmail();
      expect(email).toMatch(/^[a-z]+\.[a-z]+@[a-z]+\.[a-z]+$/);
    });

    it('should generate randomBool', () => {
      const bool = resolver.randomBool();
      expect(typeof bool).toBe('boolean');
    });
  });

  describe('Distribution Functions', () => {
    const distribution: DistributionParams = {
      type: 'gaussian',
      mean: 100,
      stdDev: 10,
      minRate: 0.5,
      maxRate: 1.5,
      burstRate: 10,
      baseRate: 1,
    };

    beforeEach(() => {
      resolver = new VariableResolver({}, {}, distribution);
    });

    it('should generate gaussian distribution', () => {
      const values: number[] = [];
      for (let i = 0; i < 100; i++) {
        values.push(resolver.gaussian(100, 10));
      }
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      expect(mean).toBeGreaterThan(90);
      expect(mean).toBeLessThan(110);
    });

    it('should generate gaussian with custom args', () => {
      const value = resolver.gaussian(200, 25);
      expect(typeof value).toBe('number');
    });

    it('should generate uniform distribution', () => {
      const min = 5;
      const max = 10;
      const values: number[] = [];
      for (let i = 0; i < 100; i++) {
        values.push(resolver.uniform(min, max));
      }
      const allInRange = values.every(v => v >= min && v < max);
      expect(allInRange).toBe(true);
    });

    it('should generate linear distribution', () => {
      const start = 1;
      const end = 10;
      resolver.incrementIteration();
      const value = resolver.linear(start, end);
      expect(value).toBeGreaterThanOrEqual(start);
      expect(value).toBeLessThanOrEqual(end);
    });

    it('should generate exponential distribution', () => {
      const lambda = 0.5;
      const value = resolver.exponential(lambda);
      expect(value).toBeGreaterThan(0);
    });

    it('should generate poisson distribution', () => {
      const lambda = 10;
      const value = resolver.poisson(lambda);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    });

    it('should generate burst distribution', () => {
      const value = resolver.burst();
      const burstRate = distribution.burstRate!;
      const baseRate = distribution.baseRate!;
      expect([burstRate, baseRate]).toContain(value);
    });
  });

  describe('Variable Resolution', () => {
    const globalVars: GlobalVariables = {
      baseUrl: 'https://api.example.com',
      regions: ['us-west-2', 'eu-central-1'],
    };

    const scenarioVars: ScenarioVariables = {
      sessionId: '${uuid}',
      userId: 'user-123',
      count: 42,
      isActive: true,
    };

    beforeEach(() => {
      resolver = new VariableResolver(globalVars, scenarioVars, { type: 'uniform' });
    });

    it('should resolve global variable', () => {
      const value = resolver.resolveValue('${baseUrl}');
      expect(value).toBe('https://api.example.com');
    });

    it('should resolve scenario variable', () => {
      const value = resolver.resolveValue('${userId}');
      expect(value).toBe('user-123');
    });

    it('should resolve numeric variable', () => {
      const value = resolver.resolveValue('${count}');
      expect(value).toBe(42);
    });

    it('should resolve boolean variable', () => {
      const value = resolver.resolveValue('${isActive}');
      expect(value).toBe(true);
    });

    it('should resolve UUID function in variable', () => {
      const value = resolver.resolveValue('${sessionId}');
      expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should resolve embedded expressions', () => {
      const value = resolver.resolveValue('${firstName}.${lastName}@example.com');
      expect(value).toMatch(/^[A-Z][a-z]+\.[A-Z][a-z]+@example\.com$/);
    });

    it('should resolve plain strings unchanged', () => {
      const value = resolver.resolveValue('plain-string');
      expect(value).toBe('plain-string');
    });
  });

  describe('Attribute Resolution', () => {
    beforeEach(() => {
      resolver = new VariableResolver({}, {}, { type: 'gaussian', mean: 100, stdDev: 10 });
    });

    it('should resolve all attributes', () => {
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

    it('should keep non-expression values unchanged', () => {
      const attrs = {
        'static.attr': 'value',
        'numeric.attr': 123,
        'boolean.attr': true,
      };
      const resolved = resolver.resolveAttributes(attrs);
      expect(resolved).toEqual(attrs);
    });
  });

  describe('Update Context', () => {
    it('should update global variables', () => {
      resolver.updateContext({ globalVar: 'globalValue' }, {}, { type: 'uniform' });
      expect(resolver.resolveValue('${globalVar}')).toBe('globalValue');
    });

    it('should update scenario variables', () => {
      resolver.updateContext({}, { scenarioVar: 'scenarioValue' }, { type: 'uniform' });
      expect(resolver.resolveValue('${scenarioVar}')).toBe('scenarioValue');
    });

    it('should update distribution', () => {
      resolver.updateContext({}, {}, { type: 'gaussian', mean: 200, stdDev: 25 });
      const value = resolver.resolveValue('${gaussian(200,25)}');
      expect(typeof value).toBe('number');
    });

    it('should resolve distribution params from variables', () => {
      resolver.updateContext(
        { meanDuration: '150', stdDevDuration: '20' },
        {},
        { type: 'gaussian', mean: '${meanDuration}' as any, stdDev: '${stdDevDuration}' as any }
      );
      const value = resolver.resolveValue('${gaussian}');
      expect(typeof value).toBe('number');
    });

    it('should use resolved distribution in gaussian function', () => {
      resolver.updateContext(
        { meanVal: '100', stdDevVal: '15' },
        {},
        { type: 'gaussian', mean: '${meanVal}' as any, stdDev: '${stdDevVal}' as any }
      );
      const values: number[] = [];
      for (let i = 0; i < 100; i++) {
        values.push(resolver.gaussian(
          resolver['distribution'].mean as number,
          resolver['distribution'].stdDev as number
        ));
      }
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      expect(mean).toBeGreaterThan(85);
      expect(mean).toBeLessThan(115);
    });

    it('should reset counters', () => {
      resolver.incrementCounter();
      resolver.incrementCounter();
      resolver.resetCounters();
      resolver.incrementIteration();
      resolver.incrementIteration();
      resolver.incrementIteration();
      resolver.resetCounters();
      expect(resolver.incrementCounter()).toBe(1);
    });
  });

  describe('Distribution Objects', () => {
    it('should resolve gaussian distribution object', () => {
      const scenarioVars = {
        cpuUsage: { gaussian: { mean: 50, stdDev: 15 } }
      };
      resolver = new VariableResolver({}, scenarioVars, { type: 'gaussian', mean: 100, stdDev: 10 });
      const value = resolver.resolveValue('${cpuUsage}');
      expect(typeof value).toBe('number');
    });

    it('should resolve uniform distribution object', () => {
      const scenarioVars = {
        responseTime: { uniform: { min: 100, max: 500 } }
      };
      resolver = new VariableResolver({}, scenarioVars, { type: 'uniform' });
      const value = resolver.resolveValue('${responseTime}');
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(100);
      expect(value).toBeLessThan(500);
    });

    it('should resolve randomChoice distribution object', () => {
      const scenarioVars = {
        status: { randomChoice: ['success', 'failed', 'pending'] }
      };
      resolver = new VariableResolver({}, scenarioVars, { type: 'uniform' });
      const value = resolver.resolveValue('${status}');
      expect(['success', 'failed', 'pending']).toContain(value);
    });

    it('should resolve uuid distribution object', () => {
      const scenarioVars = {
        sessionId: { uuid: {} }
      };
      resolver = new VariableResolver({}, scenarioVars, { type: 'uniform' });
      const value = resolver.resolveValue('${sessionId}');
      expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should resolve randomInt distribution object', () => {
      const scenarioVars = {
        userId: { randomInt: { min: 1000, max: 9999 } }
      };
      resolver = new VariableResolver({}, scenarioVars, { type: 'uniform' });
      const value = resolver.resolveValue('${userId}');
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(1000);
      expect(value).toBeLessThanOrEqual(9999);
    });

    it('should resolve exponential distribution object', () => {
      const scenarioVars = {
        errorRate: { exponential: { lambda: 0.1 } }
      };
      resolver = new VariableResolver({}, scenarioVars, { type: 'exponential', lambda: 0.1 });
      const value = resolver.resolveValue('${errorRate}');
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    });

    it('should resolve poisson distribution object', () => {
      const scenarioVars = {
        eventCount: { poisson: { lambda: 10 } }
      };
      resolver = new VariableResolver({}, scenarioVars, { type: 'poisson', lambda: 10 });
      const value = resolver.resolveValue('${eventCount}');
      expect(typeof value).toBe('number');
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    });

    it('should resolve burst distribution object', () => {
      const scenarioVars = {
        load: { burst: { burstRate: 100, baseRate: 10 } }
      };
      resolver = new VariableResolver({}, scenarioVars, { type: 'burst', burstRate: 100, baseRate: 10 });
      const value = resolver.resolveValue('${load}');
      expect([100, 10]).toContain(value);
    });

    it('should resolve randomName distribution object', () => {
      const scenarioVars = {
        userName: { randomName: {} }
      };
      resolver = new VariableResolver({}, scenarioVars, { type: 'uniform' });
      const value = resolver.resolveValue('${userName}');
      expect(value).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    });

    it('should resolve randomEmail distribution object', () => {
      const scenarioVars = {
        email: { randomEmail: {} }
      };
      resolver = new VariableResolver({}, scenarioVars, { type: 'uniform' });
      const value = resolver.resolveValue('${email}');
      expect(value).toMatch(/^[a-z]+\.[a-z]+@[a-z]+\.[a-z]+$/);
    });

    it('should use default distribution params when not provided', () => {
      const scenarioVars = {
        metric: { gaussian: {} }
      };
      resolver = new VariableResolver({}, scenarioVars, { type: 'gaussian', mean: 200, stdDev: 25 });
      const values: number[] = [];
      for (let i = 0; i < 100; i++) {
        values.push(resolver.resolveValue('${metric}') as number);
      }
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      expect(mean).toBeGreaterThan(175);
      expect(mean).toBeLessThan(225);
    });
  });
});
