import type { GlobalVariables, ScenarioVariables, DistributionParams, DistributionType, VariableHierarchy } from './types';

export class ProjectVariablesBuilder {
  private variables: GlobalVariables = {};

  add(name: string, value: string | number | boolean | string[] | number[]): this {
    this.variables[name] = value;
    return this;
  }

  addFromObject(obj: Record<string, string | number | boolean | string[] | number[]>): this {
    this.variables = { ...this.variables, ...obj };
    return this;
  }

  build(): GlobalVariables {
    return { ...this.variables };
  }

  getProjectVariables(): GlobalVariables {
    return { ...this.variables };
  }
}

export class ServiceVariablesBuilder {
  private variables: GlobalVariables = {};
  private _projectVariables: GlobalVariables = {};

  withProjectVariables(projectVars: GlobalVariables): this {
    this._projectVariables = projectVars;
    return this;
  }

  add(name: string, value: string | number | boolean | string[] | number[]): this {
    this.variables[name] = value;
    return this;
  }

  addFromObject(obj: Record<string, string | number | boolean | string[] | number[]>): this {
    this.variables = { ...this.variables, ...obj };
    return this;
  }

  build(): GlobalVariables {
    return { ...this._projectVariables, ...this.variables };
  }

  getOwnVariables(): GlobalVariables {
    return { ...this.variables };
  }

  getProjectVariables(): GlobalVariables {
    return { ...this._projectVariables };
  }

  getServiceVariables(): GlobalVariables {
    return { ...this.variables };
  }

  getAllVariables(): GlobalVariables {
    return { ...this._projectVariables, ...this.variables };
  }
}

export class ScenarioVariablesBuilder {
  private scenarioVariables: ScenarioVariables = {};
  private distribution: DistributionParams = { type: 'uniform' as DistributionType };
  private _serviceVariables: GlobalVariables = {};
  private _projectVariables: GlobalVariables = {};

  withProjectVariables(projectVars: GlobalVariables): this {
    this._projectVariables = projectVars;
    return this;
  }

  withServiceVariables(serviceVars: GlobalVariables): this {
    this._serviceVariables = serviceVars;
    return this;
  }

  addVariable(name: string, value: string | number | boolean | string[] | number[]): this {
    this.scenarioVariables[name] = value;
    return this;
  }

  addVariableFromObject(obj: Record<string, string | number | boolean | string[] | number[]>): this {
    this.scenarioVariables = { ...this.scenarioVariables, ...obj };
    return this;
  }

  setDistribution(type: DistributionType): this {
    this.distribution = { type };
    return this;
  }

  setDistributionParams(params: Partial<DistributionParams>): this {
    this.distribution = { ...this.distribution, ...params };
    return this;
  }

  build(): { 
    scenarioVariables: ScenarioVariables; 
    resolvedScenarioVariables: ScenarioVariables;
    globalVariables: GlobalVariables;
    distribution: DistributionParams;
  } {
    const globalVariables = { ...this._projectVariables, ...this._serviceVariables };
    const resolvedScenarioVariables = this.resolveScenarioVariables();
    
    return {
      scenarioVariables: { ...this.scenarioVariables },
      resolvedScenarioVariables,
      globalVariables,
      distribution: { ...this.distribution },
    };
  }

  getProjectVariables(): GlobalVariables {
    return { ...this._projectVariables };
  }

  getServiceVariables(): GlobalVariables {
    return { ...this._serviceVariables };
  }

  getScenarioVariables(): ScenarioVariables {
    return { ...this.scenarioVariables };
  }

  getGlobalVariables(): GlobalVariables {
    return { ...this._projectVariables, ...this._serviceVariables };
  }

  getDistribution(): DistributionParams {
    return { ...this.distribution };
  }

  getOwnVariables(): ScenarioVariables {
    return { ...this.scenarioVariables };
  }

  private resolveScenarioVariables(): ScenarioVariables {
    const resolved: ScenarioVariables = {};
    
    for (const [key, value] of Object.entries(this.scenarioVariables)) {
      const resolvedValue = this.resolveVariableValue(value);
      resolved[key] = resolvedValue as string | number | boolean | string[] | number[];
    }
    
    return resolved;
  }

  private resolveVariableValue(value: unknown): unknown {
    if (typeof value === 'string') {
      if (value.startsWith('${') && value.endsWith('}')) {
        return value;
      }
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.resolveVariableValue(v));
    }
    if (typeof value === 'object' && value !== null) {
      if ('type' in value) {
        return value;
      }
      const resolved: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        resolved[k] = this.resolveVariableValue(v);
      }
      return resolved;
    }
    return value;
  }
}

export class VariableHierarchyBuilder {
  private projectVariables: GlobalVariables = {};
  private serviceVariables: GlobalVariables = {};
  private scenarioVariables: ScenarioVariables = {};
  private distribution: DistributionParams = { type: 'uniform' as DistributionType };

  setProjectVariables(vars: GlobalVariables): this {
    this.projectVariables = vars;
    return this;
  }

  setServiceVariables(vars: GlobalVariables): this {
    this.serviceVariables = vars;
    return this;
  }

  setScenarioVariables(vars: ScenarioVariables): this {
    this.scenarioVariables = vars;
    return this;
  }

  setDistribution(dist: DistributionParams): this {
    this.distribution = dist;
    return this;
  }

  build(): VariableHierarchy {
    return {
      projectVariables: { ...this.projectVariables },
      serviceVariables: { ...this.serviceVariables },
      scenarioVariables: { ...this.scenarioVariables },
    };
  }

  buildResolved(): {
    globalVariables: GlobalVariables;
    scenarioVariables: ScenarioVariables;
    distribution: DistributionParams;
  } {
    const globalVariables = { ...this.projectVariables, ...this.serviceVariables };
    return {
      globalVariables,
      scenarioVariables: { ...this.scenarioVariables },
      distribution: { ...this.distribution },
    };
  }

  getProjectVariables(): GlobalVariables {
    return { ...this.projectVariables };
  }

  getServiceVariables(): GlobalVariables {
    return { ...this.serviceVariables };
  }

  getScenarioVariables(): ScenarioVariables {
    return { ...this.scenarioVariables };
  }

  getGlobalVariables(): GlobalVariables {
    return { ...this.projectVariables, ...this.serviceVariables };
  }
}

export function mergeVariables(
  projectVars: GlobalVariables,
  serviceVars: GlobalVariables,
  scenarioVars: ScenarioVariables
): {
  globalVariables: GlobalVariables;
  scenarioVariables: ScenarioVariables;
} {
  return {
    globalVariables: { ...projectVars, ...serviceVars },
    scenarioVariables: { ...scenarioVars },
  };
}
