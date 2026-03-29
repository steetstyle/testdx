export type VariableValue = string | number | boolean | string[] | number[] | Record<string, unknown>;

export type DistributionType = 'uniform' | 'linear' | 'gaussian' | 'normal' | 'exponential' | 'burst' | 'poisson';

export interface DistributionParams {
  type: DistributionType;
  rate?: number;
  interval?: string;
  duration?: number;
  startRate?: number;
  endRate?: number;
  mean?: number;
  stdDev?: number;
  minRate?: number;
  maxRate?: number;
  lambda?: number;
  burstRate?: number;
  baseRate?: number;
  burstInterval?: string;
  min?: number;
  max?: number;
}

export type DistributionFunction = 
  | { type: 'gaussian' }
  | { type: 'gaussian'; mean: number; stdDev: number }
  | { type: 'uniform'; min: number; max: number }
  | { type: 'linear'; start: number; end: number }
  | { type: 'exponential'; lambda: number }
  | { type: 'poisson'; lambda: number }
  | { type: 'burst' }
  | { type: 'burst'; burstRate: number; baseRate: number };

export type ResolvableValue = 
  | string
  | number
  | boolean
  | string[]
  | number[]
  | DistributionFunction
  | { expression: string }
  | { gaussian: { mean?: number; stdDev?: number } }
  | { uniform: { min?: number; max?: number } }
  | { linear: { start?: number; end?: number } }
  | { exponential: { lambda?: number } }
  | { poisson: { lambda?: number } }
  | { burst: { burstRate?: number; baseRate?: number } }
  | { randomInt: { min?: number; max?: number } }
  | { randomFloat: { min?: number; max?: number } }
  | { randomChoice: string[] }
  | { uuid: {} }
  | { traceId: {} }
  | { spanId: {} }
  | { unixTimestamp: {} }
  | { isoTimestamp: {} }
  | { increment: {} }
  | { randomBool: {} }
  | { randomName: {} }
  | { firstName: {} }
  | { lastName: {} }
  | { randomEmail: {} };

export interface GlobalVariables {
  [key: string]: VariableValue;
}

export interface ScenarioVariables {
  [key: string]: ResolvableValue;
}

export interface VariableContext {
  global: GlobalVariables;
  scenario: ScenarioVariables;
  distribution: DistributionParams;
  iteration?: number;
  timestamp?: number;
  traceId?: string;
  spanId?: string;
}

export interface VariableResolutionResult {
  attributes: Record<string, string | number | boolean>;
  variables: Record<string, VariableValue>;
  errors: string[];
}

export interface VariableHierarchy {
  projectVariables: GlobalVariables;
  serviceVariables: GlobalVariables;
  scenarioVariables: ScenarioVariables;
}
