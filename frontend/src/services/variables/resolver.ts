import type {
  VariableContext,
  VariableValue,
  DistributionParams,
  GlobalVariables,
  ScenarioVariables
} from './types';

const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Lisa', 'Daniel', 'Nancy',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
];

const DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'mail.com',
  'example.com', 'test.com', 'company.com', 'business.com'
];

export class VariableResolver {
  private globalVariables: GlobalVariables;
  private scenarioVariables: ScenarioVariables;
  private distribution: DistributionParams;
  private iteration: number = 0;
  private counter: number = 0;
  private gaussianCache: Map<string, { values: number[]; index: number }> = new Map();

  constructor(
    globalVariables: GlobalVariables = {},
    scenarioVariables: ScenarioVariables = {},
    distribution: DistributionParams = { type: 'uniform' }
  ) {
    this.globalVariables = globalVariables;
    this.scenarioVariables = scenarioVariables;
    this.distribution = distribution;
  }

  updateContext(
    globalVariables?: GlobalVariables,
    scenarioVariables?: ScenarioVariables,
    distribution?: DistributionParams
  ): void {
    if (globalVariables) this.globalVariables = { ...this.globalVariables, ...globalVariables };
    if (scenarioVariables) this.scenarioVariables = { ...this.scenarioVariables, ...scenarioVariables };
    if (distribution) {
      const merged = { ...this.distribution, ...distribution };
      this.distribution = this.resolveDistribution(merged);
    }
  }

  resetCounters(): void {
    this.iteration = 0;
    this.counter = 0;
    this.gaussianCache.clear();
  }

  incrementIteration(): void {
    this.iteration++;
  }

  incrementCounter(): number {
    return ++this.counter;
  }

  resolveDistribution(dist: DistributionParams): DistributionParams {
    const resolved: DistributionParams = { type: dist.type };
    
    if (dist.mean !== undefined) {
      resolved.mean = typeof dist.mean === 'string' 
        ? Number(this.resolveString(String(dist.mean))) 
        : dist.mean;
    }
    if (dist.stdDev !== undefined) {
      resolved.stdDev = typeof dist.stdDev === 'string'
        ? Number(this.resolveString(String(dist.stdDev)))
        : dist.stdDev;
    }
    if (dist.minRate !== undefined) {
      resolved.minRate = typeof dist.minRate === 'string'
        ? Number(this.resolveString(String(dist.minRate)))
        : dist.minRate;
    }
    if (dist.maxRate !== undefined) {
      resolved.maxRate = typeof dist.maxRate === 'string'
        ? Number(this.resolveString(String(dist.maxRate)))
        : dist.maxRate;
    }
    if (dist.lambda !== undefined) {
      resolved.lambda = typeof dist.lambda === 'string'
        ? Number(this.resolveString(String(dist.lambda)))
        : dist.lambda;
    }
    if (dist.burstRate !== undefined) {
      resolved.burstRate = typeof dist.burstRate === 'string'
        ? Number(this.resolveString(String(dist.burstRate)))
        : dist.burstRate;
    }
    if (dist.baseRate !== undefined) {
      resolved.baseRate = typeof dist.baseRate === 'string'
        ? Number(this.resolveString(String(dist.baseRate)))
        : dist.baseRate;
    }
    if (dist.rate !== undefined) {
      resolved.rate = typeof dist.rate === 'string'
        ? Number(this.resolveString(String(dist.rate)))
        : dist.rate;
    }
    if (dist.interval !== undefined) {
      resolved.interval = dist.interval;
    }
    if (dist.duration !== undefined) {
      resolved.duration = typeof dist.duration === 'string'
        ? Number(this.resolveString(String(dist.duration)))
        : dist.duration;
    }
    if (dist.startRate !== undefined) {
      resolved.startRate = typeof dist.startRate === 'string'
        ? Number(this.resolveString(String(dist.startRate)))
        : dist.startRate;
    }
    if (dist.endRate !== undefined) {
      resolved.endRate = typeof dist.endRate === 'string'
        ? Number(this.resolveString(String(dist.endRate)))
        : dist.endRate;
    }
    if (dist.burstInterval !== undefined) {
      resolved.burstInterval = dist.burstInterval;
    }
    
    return resolved;
  }

  resolveValue(value: string | number | boolean): string | number | boolean {
    if (typeof value === 'string') {
      return this.resolveString(value);
    }
    return value;
  }

  private resolveString(value: string): string | number | boolean {
    const match = value.match(/^\$\{([^}]+)\}$/);
    if (!match) {
      return this.resolveEmbeddedExpressions(value);
    }

    const expression = match[1].trim();
    return this.evaluateExpression(expression);
  }

  private resolveEmbeddedExpressions(value: string): string {
    return value.replace(/\$\{([^}]+)\}/g, (match, expr) => {
      const result = this.evaluateExpression(expr.trim());
      return String(result);
    });
  }

  private evaluateExpression(expression: string): string | number | boolean {
    const [funcName, ...argsStr] = expression.split('(');
    const funcNameLower = funcName.trim().toLowerCase();
    const args = argsStr.length > 0 ? argsStr[0].replace(/\)$/, '').split(',').map(s => s.trim()) : [];

    switch (funcNameLower) {
      case 'uuid':
        return this.uuid();
      
      case 'traceid':
        return this.traceId();
      
      case 'spanid':
        return this.spanId();
      
      case 'unixtimestamp':
        return this.unixTimestamp();
      
      case 'isotimestamp':
        return this.isoTimestamp();
      
      case 'increment':
        return this.increment();
      
      case 'randomint':
        return this.randomInt(args);
      
      case 'randomfloat':
        return this.randomFloat(args);
      
      case 'randomchoice':
        return this.randomChoice(args);
      
      case 'randomname':
        return this.randomName();
      
      case 'firstname':
        return this.firstName();
      
      case 'lastname':
        return this.lastName();
      
      case 'randomemail':
        return this.randomEmail();
      
      case 'randombool':
        return this.randomBool();
      
      case 'gaussian':
        return this.gaussianFromArgs(args);
      
      case 'uniform':
        return this.uniformFromArgs(args);
      
      case 'linear':
        return this.linearFromArgs(args);
      
      case 'exponential':
        return this.exponentialFromArgs(args);
      
      case 'poisson':
        return this.poissonFromArgs(args);
      
      case 'burst':
        return this.burstFromArgs();
      
      default: {
        const value = this.resolveVariable(funcName.trim());
        if (value !== undefined) {
          if (Array.isArray(value)) return value.join(',');
          if (typeof value === 'object') return JSON.stringify(value);
          return value as string | number | boolean;
        }
        return expression;
      }
    }
  }

  private resolveVariable(name: string): VariableValue | undefined {
    if (name in this.scenarioVariables) {
      const value = this.scenarioVariables[name];
      return this.resolveVariableValue(value);
    }
    if (name in this.globalVariables) {
      const value = this.globalVariables[name];
      return this.resolveVariableValue(value);
    }
    return undefined;
  }

  private resolveVariableValue(value: unknown): VariableValue | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === 'string') {
      if (value.match(/^\$\{([^}]+)\}$/)) {
        return this.resolveValue(value) as VariableValue;
      }
      return value;
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if ('type' in obj) {
        return this.evaluateDistribution(obj as { type: string; [key: string]: unknown });
      }
      if ('gaussian' in obj) {
        const g = obj.gaussian as { mean?: number; stdDev?: number };
        return this.gaussian(g?.mean ?? this.distribution.mean ?? 100, g?.stdDev ?? this.distribution.stdDev ?? 10);
      }
      if ('uniform' in obj) {
        const u = obj.uniform as { min?: number; max?: number };
        return this.uniform(u?.min ?? this.distribution.minRate ?? 0.5, u?.max ?? this.distribution.maxRate ?? 1.5);
      }
      if ('linear' in obj) {
        const l = obj.linear as { start?: number; end?: number };
        return this.linear(l?.start ?? this.distribution.minRate ?? 0.5, l?.end ?? this.distribution.maxRate ?? 1.5);
      }
      if ('exponential' in obj) {
        const e = obj.exponential as { lambda?: number };
        return this.exponential(e?.lambda ?? this.distribution.lambda ?? 1);
      }
      if ('poisson' in obj) {
        const p = obj.poisson as { lambda?: number };
        return this.poisson(p?.lambda ?? this.distribution.lambda ?? 10);
      }
      if ('burst' in obj) {
        return this.burst();
      }
      if ('randomInt' in obj) {
        const r = obj.randomInt as { min?: number; max?: number };
        return this.randomInt([String(r?.min ?? 0), String(r?.max ?? 1000)]);
      }
      if ('randomFloat' in obj) {
        const r = obj.randomFloat as { min?: number; max?: number };
        return this.randomFloat([String(r?.min ?? 0), String(r?.max ?? 100)]);
      }
      if ('randomChoice' in obj) {
        const choices = obj.randomChoice as string[];
        return this.randomChoice(choices);
      }
      if ('uuid' in obj) return this.uuid();
      if ('traceId' in obj) return this.traceId();
      if ('spanId' in obj) return this.spanId();
      if ('unixTimestamp' in obj) return this.unixTimestamp();
      if ('isoTimestamp' in obj) return this.isoTimestamp();
      if ('increment' in obj) return this.increment();
      if ('randomBool' in obj) return this.randomBool();
      if ('randomName' in obj) return this.randomName();
      if ('firstName' in obj) return this.firstName();
      if ('lastName' in obj) return this.lastName();
      if ('randomEmail' in obj) return this.randomEmail();
    }

    if (Array.isArray(value)) {
      return value;
    }

    return value as VariableValue;
  }

  private evaluateDistribution(dist: { type: string; [key: string]: unknown }): number {
    const distWithDefaults = dist as Record<string, number | undefined>;
    switch (dist.type) {
      case 'gaussian':
      case 'normal':
        return this.gaussian(distWithDefaults.mean ?? this.distribution.mean ?? 100, distWithDefaults.stdDev ?? this.distribution.stdDev ?? 10);
      case 'uniform':
        return this.uniform(distWithDefaults.min ?? this.distribution.minRate ?? 0.5, distWithDefaults.max ?? this.distribution.maxRate ?? 1.5);
      case 'linear':
        return this.linear(distWithDefaults.start ?? this.distribution.minRate ?? 0.5, distWithDefaults.end ?? this.distribution.maxRate ?? 1.5);
      case 'exponential':
        return this.exponential(distWithDefaults.lambda ?? this.distribution.lambda ?? 1);
      case 'poisson':
        return this.poisson(distWithDefaults.lambda ?? this.distribution.lambda ?? 10);
      case 'burst':
        return this.burst();
      default:
        return this.gaussian(this.distribution.mean ?? 100, this.distribution.stdDev ?? 10);
    }
  }

  uuid(): string {
    return crypto.randomUUID();
  }

  traceId(): string {
    return crypto.randomUUID().replace(/-/g, '');
  }

  spanId(): string {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  }

  unixTimestamp(): number {
    return Date.now();
  }

  isoTimestamp(): string {
    return new Date().toISOString();
  }

  increment(): number {
    return this.incrementCounter();
  }

  randomInt(args: string[]): number {
    if (args.length >= 2) {
      const min = parseInt(args[0], 10);
      const max = parseInt(args[1], 10);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    if (args.length === 1) {
      return parseInt(args[0], 10);
    }
    return Math.floor(Math.random() * 1000);
  }

  randomFloat(args: string[]): number {
    if (args.length >= 2) {
      const min = parseFloat(args[0]);
      const max = parseFloat(args[1]);
      return Math.random() * (max - min) + min;
    }
    if (args.length === 1) {
      return parseFloat(args[0]);
    }
    return Math.random() * 100;
  }

  randomChoice(args: string[]): string {
    if (args.length > 0) {
      return args[Math.floor(Math.random() * args.length)];
    }
    return '';
  }

  randomName(): string {
    return `${this.firstName()} ${this.lastName()}`;
  }

  firstName(): string {
    return FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  }

  lastName(): string {
    return LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  }

  randomEmail(): string {
    const first = this.firstName().toLowerCase();
    const last = this.lastName().toLowerCase();
    const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
    return `${first}.${last}@${domain}`;
  }

  randomBool(): boolean {
    return Math.random() > 0.5;
  }

  gaussian(mean: number, stdDev: number): number {
    return this.boxMullerGaussian(mean, stdDev);
  }

  private boxMullerGaussian(mean: number, stdDev: number): number {
    const cacheKey = `${mean}-${stdDev}`;
    let cache = this.gaussianCache.get(cacheKey);
    
    if (!cache || cache.index >= cache.values.length) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
      cache = { values: [mean + stdDev * z0, mean + stdDev * z1], index: 0 };
      this.gaussianCache.set(cacheKey, cache);
    }
    
    return cache.values[cache.index++];
  }

  uniform(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  linear(start: number, end: number): number {
    const t = this.iteration / 100;
    return start + (end - start) * Math.min(1, t);
  }

  exponential(lambda: number): number {
    return -Math.log(Math.random()) / lambda;
  }

  poisson(lambda: number): number {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  }

  burst(): number {
    const burstRate = this.distribution.burstRate ?? 10;
    const baseRate = this.distribution.baseRate ?? 1;
    return Math.random() > 0.9 ? burstRate : baseRate;
  }

  private gaussianFromArgs(args: string[]): number {
    const mean = args.length > 0 ? parseFloat(args[0]) : (this.distribution.mean ?? 100);
    const stdDev = args.length > 1 ? parseFloat(args[1]) : (this.distribution.stdDev ?? 10);
    return this.gaussian(mean, stdDev);
  }

  private uniformFromArgs(args: string[]): number {
    const min = args.length > 0 ? parseFloat(args[0]) : (this.distribution.minRate ?? 0.5);
    const max = args.length > 1 ? parseFloat(args[1]) : (this.distribution.maxRate ?? 1.5);
    return this.uniform(min, max);
  }

  private linearFromArgs(args: string[]): number {
    const start = args.length > 0 ? parseFloat(args[0]) : (this.distribution.minRate ?? 0.5);
    const end = args.length > 1 ? parseFloat(args[1]) : (this.distribution.maxRate ?? 1.5);
    return this.linear(start, end);
  }

  private exponentialFromArgs(args: string[]): number {
    const lambda = args.length > 0 ? parseFloat(args[0]) : (this.distribution.lambda ?? 1);
    return this.exponential(lambda);
  }

  private poissonFromArgs(args: string[]): number {
    const lambda = args.length > 0 ? parseFloat(args[0]) : (this.distribution.lambda ?? 10);
    return this.poisson(lambda);
  }

  private burstFromArgs(): number {
    return this.burst();
  }

  resolveAttributes(attributes: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
    const resolved: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(attributes)) {
      resolved[key] = this.resolveValue(value);
    }
    return resolved;
  }
}

export default VariableResolver;
