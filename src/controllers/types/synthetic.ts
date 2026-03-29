import { OtelSdkConfig } from '../../models/otel';

export type DistributionObject = {
  gaussian?: { mean?: number; stdDev?: number };
  uniform?: { min?: number; max?: number };
  linear?: { start?: number; end?: number };
  exponential?: { lambda?: number };
  poisson?: { lambda?: number };
};

export type VariableValueWithDistribution = string | number | boolean | string[] | number[] | DistributionObject;

export interface CreateProjectInput {
  name: string;
  description?: string;
  otelCollectorEndpoint?: string;
  projectVariables?: Record<string, any>;
  services?: CreateServiceInput[];
}

export interface CreateServiceInput {
  projectId: string;
  name: string;
  description?: string;
  otelSdkConfig?: Partial<OtelSdkConfig>;
  scenarios?: CreateScenarioInput[];
}

export interface CreateScenarioInput {
  projectId: string;
  serviceId: string;
  name: string;
  description?: string;
  telemetryType: any;
  params?: any;
  attributes?: Record<string, string>;
  distribution?: any;
  variables?: Record<string, VariableValueWithDistribution>;
  schedule?: any;
  limits?: any;
  isActive?: boolean;
}

export interface FullYamlConfig {
  name?: string;
  description?: string;
  otelCollectorEndpoint?: string;
  project?: {
    name?: string;
    description?: string;
    otelCollectorEndpoint?: string;
  };
  projectVariables?: Record<string, VariableValueWithDistribution>;
  variables?: Record<string, VariableValueWithDistribution>;
  services?: Array<{
    name?: string;
    description?: string;
    otelSdkConfig?: Partial<OtelSdkConfig>;
    serviceVariables?: Record<string, VariableValueWithDistribution>;
    variables?: Record<string, VariableValueWithDistribution>;
    scenarios?: Array<CreateScenarioInput & { variables?: Record<string, VariableValueWithDistribution> }>;
  }>;
}