import {
  ProjectVariablesBuilder,
  ServiceVariablesBuilder,
  ScenarioVariablesBuilder,
  VariableHierarchyBuilder,
  mergeVariables,
} from '../../../services/variables/builders';
import { GlobalVariables, ScenarioVariables, DistributionType } from '../../../services/variables/types';

describe('VariableBuilders', () => {
  describe('ProjectVariablesBuilder', () => {
    let builder: ProjectVariablesBuilder;

    beforeEach(() => {
      builder = new ProjectVariablesBuilder();
    });

    it('should build empty object initially', () => {
      expect(builder.build()).toEqual({});
    });

    it('should add single variable', () => {
      builder.add('env', 'production');
      expect(builder.build()).toEqual({ env: 'production' });
    });

    it('should add multiple variables', () => {
      builder.add('env', 'production').add('region', 'us-west-2');
      expect(builder.build()).toEqual({ env: 'production', region: 'us-west-2' });
    });

    it('should add variables from object', () => {
      builder.addFromObject({ env: 'production', region: 'us-west-2', timeout: 5000 });
      expect(builder.build()).toEqual({ env: 'production', region: 'us-west-2', timeout: 5000 });
    });

    it('should overwrite existing variable', () => {
      builder.add('env', 'production').add('env', 'staging');
      expect(builder.build()).toEqual({ env: 'staging' });
    });

    it('should support chaining', () => {
      const result = builder.add('a', 1).add('b', 2).addFromObject({ c: 3 }).build();
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should return new object on each build call', () => {
      builder.add('env', 'production');
      const first = builder.build();
      const second = builder.build();
      expect(first).not.toBe(second);
    });

    it('should get project variables', () => {
      builder.add('env', 'production');
      expect(builder.getProjectVariables()).toEqual({ env: 'production' });
    });
  });

  describe('ServiceVariablesBuilder', () => {
    let builder: ServiceVariablesBuilder;

    beforeEach(() => {
      builder = new ServiceVariablesBuilder();
    });

    it('should build empty object initially', () => {
      expect(builder.build()).toEqual({});
    });

    it('should add service variables', () => {
      builder.add('endpoint', 'http://api.example.com');
      expect(builder.build()).toEqual({ endpoint: 'http://api.example.com' });
    });

    it('should merge with project variables', () => {
      builder.withProjectVariables({ env: 'production', region: 'us-west-2' });
      builder.add('endpoint', 'http://api.example.com');
      expect(builder.build()).toEqual({
        env: 'production',
        region: 'us-west-2',
        endpoint: 'http://api.example.com',
      });
    });

    it('should let service variables override project variables', () => {
      builder.withProjectVariables({ env: 'production', region: 'us-west-2' });
      builder.add('env', 'staging');
      expect(builder.build()).toEqual({
        env: 'staging',
        region: 'us-west-2',
      });
    });

    it('should get own variables', () => {
      builder.add('endpoint', 'http://api.example.com');
      expect(builder.getOwnVariables()).toEqual({ endpoint: 'http://api.example.com' });
    });

    it('should get project variables', () => {
      builder.withProjectVariables({ env: 'production' });
      expect(builder.getProjectVariables()).toEqual({ env: 'production' });
    });

    it('should get all variables including project', () => {
      builder.withProjectVariables({ env: 'production' });
      builder.add('endpoint', 'http://api.example.com');
      expect(builder.getAllVariables()).toEqual({
        env: 'production',
        endpoint: 'http://api.example.com',
      });
    });
  });

  describe('ScenarioVariablesBuilder', () => {
    let builder: ScenarioVariablesBuilder;

    beforeEach(() => {
      builder = new ScenarioVariablesBuilder();
    });

    it('should build with default distribution', () => {
      const result = builder.build();
      expect(result.distribution).toEqual({ type: 'uniform' });
    });

    it('should add scenario variables', () => {
      builder.addVariable('userId', 123);
      const result = builder.build();
      expect(result.scenarioVariables).toEqual({ userId: 123 });
    });

    it('should merge project and service variables into global', () => {
      builder.withProjectVariables({ env: 'production' });
      builder.withServiceVariables({ endpoint: 'http://api.example.com' });
      const result = builder.build();
      expect(result.globalVariables).toEqual({
        env: 'production',
        endpoint: 'http://api.example.com',
      });
    });

    it('should set distribution type', () => {
      builder.setDistribution('gaussian');
      expect(builder.getDistribution().type).toBe('gaussian');
    });

    it('should set distribution params', () => {
      builder.setDistributionParams({ mean: 100, stdDev: 15 });
      expect(builder.getDistribution()).toEqual({ type: 'uniform', mean: 100, stdDev: 15 });
    });

    it('should get scenario variables separately', () => {
      builder.addVariable('userId', 123);
      expect(builder.getScenarioVariables()).toEqual({ userId: 123 });
    });

    it('should get global variables (project + service)', () => {
      builder.withProjectVariables({ env: 'production' });
      builder.withServiceVariables({ endpoint: 'http://api.example.com' });
      expect(builder.getGlobalVariables()).toEqual({
        env: 'production',
        endpoint: 'http://api.example.com',
      });
    });

    it('should preserve variable types', () => {
      builder.addVariable('count', 42);
      builder.addVariable('name', 'test');
      builder.addVariable('enabled', true);
      builder.addVariable('tags', ['a', 'b', 'c']);
      const result = builder.build();
      expect(result.scenarioVariables).toEqual({
        count: 42,
        name: 'test',
        enabled: true,
        tags: ['a', 'b', 'c'],
      });
    });
  });

  describe('VariableHierarchyBuilder', () => {
    let builder: VariableHierarchyBuilder;

    beforeEach(() => {
      builder = new VariableHierarchyBuilder();
    });

    it('should build empty hierarchy', () => {
      const result = builder.build();
      expect(result).toEqual({
        projectVariables: {},
        serviceVariables: {},
        scenarioVariables: {},
      });
    });

    it('should set project variables', () => {
      builder.setProjectVariables({ env: 'production' });
      expect(builder.getProjectVariables()).toEqual({ env: 'production' });
    });

    it('should set service variables', () => {
      builder.setServiceVariables({ endpoint: 'http://api.example.com' });
      expect(builder.getServiceVariables()).toEqual({ endpoint: 'http://api.example.com' });
    });

    it('should set scenario variables', () => {
      builder.setScenarioVariables({ userId: 123 });
      expect(builder.getScenarioVariables()).toEqual({ userId: 123 });
    });

    it('should build resolved with merged global variables', () => {
      builder.setProjectVariables({ env: 'production', region: 'us-west-2' });
      builder.setServiceVariables({ endpoint: 'http://api.example.com', env: 'staging' });
      const result = builder.buildResolved();
      expect(result.globalVariables).toEqual({
        env: 'staging',
        region: 'us-west-2',
        endpoint: 'http://api.example.com',
      });
    });

    it('should service variables override project variables in global', () => {
      builder.setProjectVariables({ env: 'production' });
      builder.setServiceVariables({ env: 'staging' });
      const result = builder.buildResolved();
      expect(result.globalVariables).toEqual({ env: 'staging' });
    });

    it('should buildResolved return scenario variables', () => {
      builder.setScenarioVariables({ userId: 123 });
      const result = builder.buildResolved();
      expect(result.scenarioVariables).toEqual({ userId: 123 });
    });

    it('should get global variables (project + service)', () => {
      builder.setProjectVariables({ env: 'production' });
      builder.setServiceVariables({ endpoint: 'http://api.example.com' });
      expect(builder.getGlobalVariables()).toEqual({
        env: 'production',
        endpoint: 'http://api.example.com',
      });
    });

    it('should support chaining', () => {
      const result = builder
        .setProjectVariables({ env: 'production' })
        .setServiceVariables({ endpoint: 'http://api.example.com' })
        .setScenarioVariables({ userId: 123 })
        .setDistribution({ type: 'gaussian' })
        .buildResolved();

      expect(result.globalVariables).toEqual({
        env: 'production',
        endpoint: 'http://api.example.com',
      });
      expect(result.scenarioVariables).toEqual({ userId: 123 });
      expect(result.distribution).toEqual({ type: 'gaussian' });
    });
  });

  describe('mergeVariables', () => {
    it('should merge project and service variables', () => {
      const result = mergeVariables(
        { env: 'production', region: 'us-west-2' },
        { endpoint: 'http://api.example.com' },
        { userId: 123 }
      );
      expect(result.globalVariables).toEqual({
        env: 'production',
        region: 'us-west-2',
        endpoint: 'http://api.example.com',
      });
    });

    it('should let service variables override project', () => {
      const result = mergeVariables(
        { env: 'production' },
        { env: 'staging' },
        {}
      );
      expect(result.globalVariables).toEqual({ env: 'staging' });
    });

    it('should return scenario variables unchanged', () => {
      const result = mergeVariables({}, {}, { userId: 123 });
      expect(result.scenarioVariables).toEqual({ userId: 123 });
    });

    it('should handle empty objects', () => {
      const result = mergeVariables({}, {}, {});
      expect(result).toEqual({
        globalVariables: {},
        scenarioVariables: {},
      });
    });
  });
});