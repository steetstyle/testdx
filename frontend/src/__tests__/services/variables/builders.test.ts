import { describe, it, expect } from 'vitest';
import {
  ProjectVariablesBuilder,
  ServiceVariablesBuilder,
  ScenarioVariablesBuilder,
  VariableHierarchyBuilder,
  mergeVariables,
} from '../../../services/variables/builders';
import type { GlobalVariables, ScenarioVariables, DistributionType } from '../../../services/variables/types';

describe('VariableBuilders (Frontend)', () => {
  describe('ProjectVariablesBuilder', () => {
    let builder: ProjectVariablesBuilder;

    beforeEach(() => {
      builder = new ProjectVariablesBuilder();
    });

    it('builds empty object initially', () => {
      expect(builder.build()).toEqual({});
    });

    it('adds single variable', () => {
      builder.add('env', 'production');
      expect(builder.build()).toEqual({ env: 'production' });
    });

    it('adds multiple variables', () => {
      builder.add('env', 'production').add('region', 'us-west-2');
      expect(builder.build()).toEqual({ env: 'production', region: 'us-west-2' });
    });

    it('adds variables from object', () => {
      builder.addFromObject({ env: 'production', region: 'us-west-2', timeout: 5000 });
      expect(builder.build()).toEqual({ env: 'production', region: 'us-west-2', timeout: 5000 });
    });

    it('overwrites existing variable', () => {
      builder.add('env', 'production').add('env', 'staging');
      expect(builder.build()).toEqual({ env: 'staging' });
    });

    it('supports chaining', () => {
      const result = builder.add('a', 1).add('b', 2).addFromObject({ c: 3 }).build();
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('returns new object on each build call', () => {
      builder.add('env', 'production');
      const first = builder.build();
      const second = builder.build();
      expect(first).not.toBe(second);
    });

    it('gets project variables', () => {
      builder.add('env', 'production');
      expect(builder.getProjectVariables()).toEqual({ env: 'production' });
    });

    it('handles different value types', () => {
      builder
        .add('stringVal', 'hello')
        .add('numVal', 42)
        .add('boolVal', true)
        .add('arrayVal', ['a', 'b', 'c']);
      expect(builder.build()).toEqual({
        stringVal: 'hello',
        numVal: 42,
        boolVal: true,
        arrayVal: ['a', 'b', 'c'],
      });
    });
  });

  describe('ServiceVariablesBuilder', () => {
    let builder: ServiceVariablesBuilder;

    beforeEach(() => {
      builder = new ServiceVariablesBuilder();
    });

    it('builds empty object initially', () => {
      expect(builder.build()).toEqual({});
    });

    it('adds service variables', () => {
      builder.add('endpoint', 'http://api.example.com');
      expect(builder.build()).toEqual({ endpoint: 'http://api.example.com' });
    });

    it('merges with project variables', () => {
      builder.withProjectVariables({ env: 'production', region: 'us-west-2' });
      builder.add('endpoint', 'http://api.example.com');
      expect(builder.build()).toEqual({
        env: 'production',
        region: 'us-west-2',
        endpoint: 'http://api.example.com',
      });
    });

    it('lets service variables override project variables', () => {
      builder.withProjectVariables({ env: 'production', region: 'us-west-2' });
      builder.add('env', 'staging');
      expect(builder.build()).toEqual({
        env: 'staging',
        region: 'us-west-2',
      });
    });

    it('gets own variables', () => {
      builder.add('endpoint', 'http://api.example.com');
      expect(builder.getOwnVariables()).toEqual({ endpoint: 'http://api.example.com' });
    });

    it('gets project variables', () => {
      builder.withProjectVariables({ env: 'production' });
      expect(builder.getProjectVariables()).toEqual({ env: 'production' });
    });

    it('gets all variables including project', () => {
      builder.withProjectVariables({ env: 'production' });
      builder.add('endpoint', 'http://api.example.com');
      expect(builder.getAllVariables()).toEqual({
        env: 'production',
        endpoint: 'http://api.example.com',
      });
    });

    it('gets service variables', () => {
      builder.add('endpoint', 'http://api.example.com');
      expect(builder.getServiceVariables()).toEqual({ endpoint: 'http://api.example.com' });
    });
  });

  describe('ScenarioVariablesBuilder', () => {
    let builder: ScenarioVariablesBuilder;

    beforeEach(() => {
      builder = new ScenarioVariablesBuilder();
    });

    it('builds with default distribution', () => {
      const result = builder.build();
      expect(result.distribution).toEqual({ type: 'uniform' });
    });

    it('adds scenario variables', () => {
      builder.addVariable('userId', 123);
      const result = builder.build();
      expect(result.scenarioVariables).toEqual({ userId: 123 });
    });

    it('merges project and service variables into global', () => {
      builder.withProjectVariables({ env: 'production' });
      builder.withServiceVariables({ endpoint: 'http://api.example.com' });
      const result = builder.build();
      expect(result.globalVariables).toEqual({
        env: 'production',
        endpoint: 'http://api.example.com',
      });
    });

    it('sets distribution type', () => {
      builder.setDistribution('gaussian' as DistributionType);
      expect(builder.getDistribution().type).toBe('gaussian');
    });

    it('sets distribution params', () => {
      builder.setDistributionParams({ mean: 100, stdDev: 15 });
      const dist = builder.getDistribution();
      expect(dist.mean).toBe(100);
      expect(dist.stdDev).toBe(15);
    });

    it('gets scenario variables separately', () => {
      builder.addVariable('userId', 123);
      expect(builder.getScenarioVariables()).toEqual({ userId: 123 });
    });

    it('gets global variables (project + service)', () => {
      builder.withProjectVariables({ env: 'production' });
      builder.withServiceVariables({ endpoint: 'http://api.example.com' });
      expect(builder.getGlobalVariables()).toEqual({
        env: 'production',
        endpoint: 'http://api.example.com',
      });
    });

    it('preserves variable types', () => {
      builder
        .addVariable('count', 42)
        .addVariable('name', 'test')
        .addVariable('enabled', true)
        .addVariable('tags', ['a', 'b', 'c']);
      const result = builder.build();
      expect(result.scenarioVariables).toEqual({
        count: 42,
        name: 'test',
        enabled: true,
        tags: ['a', 'b', 'c'],
      });
    });

    it('returns resolved scenario variables', () => {
      builder.addVariable('userId', 123);
      const result = builder.build();
      expect(result.resolvedScenarioVariables).toEqual({ userId: 123 });
    });

    it('adds multiple variables via chaining', () => {
      builder
        .addVariable('var1', 'value1')
        .addVariable('var2', 'value2')
        .addVariableFromObject({ var3: 'value3' });
      expect(builder.getScenarioVariables()).toEqual({
        var1: 'value1',
        var2: 'value2',
        var3: 'value3',
      });
    });
  });

  describe('VariableHierarchyBuilder', () => {
    let builder: VariableHierarchyBuilder;

    beforeEach(() => {
      builder = new VariableHierarchyBuilder();
    });

    it('builds empty hierarchy', () => {
      const result = builder.build();
      expect(result).toEqual({
        projectVariables: {},
        serviceVariables: {},
        scenarioVariables: {},
      });
    });

    it('sets project variables', () => {
      builder.setProjectVariables({ env: 'production' });
      expect(builder.getProjectVariables()).toEqual({ env: 'production' });
    });

    it('sets service variables', () => {
      builder.setServiceVariables({ endpoint: 'http://api.example.com' });
      expect(builder.getServiceVariables()).toEqual({ endpoint: 'http://api.example.com' });
    });

    it('sets scenario variables', () => {
      builder.setScenarioVariables({ userId: 123 });
      expect(builder.getScenarioVariables()).toEqual({ userId: 123 });
    });

    it('builds resolved with merged global variables', () => {
      builder.setProjectVariables({ env: 'production', region: 'us-west-2' });
      builder.setServiceVariables({ endpoint: 'http://api.example.com', env: 'staging' });
      const result = builder.buildResolved();
      expect(result.globalVariables).toEqual({
        env: 'staging',
        region: 'us-west-2',
        endpoint: 'http://api.example.com',
      });
    });

    it('service variables override project variables in global', () => {
      builder.setProjectVariables({ env: 'production' });
      builder.setServiceVariables({ env: 'staging' });
      const result = builder.buildResolved();
      expect(result.globalVariables).toEqual({ env: 'staging' });
    });

    it('buildResolved returns scenario variables', () => {
      builder.setScenarioVariables({ userId: 123 });
      const result = builder.buildResolved();
      expect(result.scenarioVariables).toEqual({ userId: 123 });
    });

    it('gets global variables (project + service)', () => {
      builder.setProjectVariables({ env: 'production' });
      builder.setServiceVariables({ endpoint: 'http://api.example.com' });
      expect(builder.getGlobalVariables()).toEqual({
        env: 'production',
        endpoint: 'http://api.example.com',
      });
    });

    it('supports chaining', () => {
      const result = builder
        .setProjectVariables({ env: 'production' })
        .setServiceVariables({ endpoint: 'http://api.example.com' })
        .setScenarioVariables({ userId: 123 })
        .setDistribution({ type: 'gaussian' as DistributionType })
        .buildResolved();

      expect(result.globalVariables).toEqual({
        env: 'production',
        endpoint: 'http://api.example.com',
      });
      expect(result.scenarioVariables).toEqual({ userId: 123 });
      expect(result.distribution).toEqual({ type: 'gaussian' });
    });

    it('build returns hierarchy without merging', () => {
      builder.setProjectVariables({ projVar: 'proj' });
      builder.setServiceVariables({ svcVar: 'svc' });
      builder.setScenarioVariables({ scenVar: 'scen' });
      
      const result = builder.build();
      
      expect(result.projectVariables).toEqual({ projVar: 'proj' });
      expect(result.serviceVariables).toEqual({ svcVar: 'svc' });
      expect(result.scenarioVariables).toEqual({ scenVar: 'scen' });
    });

    it('buildResolved includes distribution', () => {
      builder.setDistribution({ type: 'gaussian', mean: 100, stdDev: 15 });
      const result = builder.buildResolved();
      expect(result.distribution).toEqual({ type: 'gaussian', mean: 100, stdDev: 15 });
    });
  });

  describe('mergeVariables', () => {
    it('merges project and service variables', () => {
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

    it('lets service variables override project', () => {
      const result = mergeVariables(
        { env: 'production' },
        { env: 'staging' },
        {}
      );
      expect(result.globalVariables).toEqual({ env: 'staging' });
    });

    it('returns scenario variables unchanged', () => {
      const result = mergeVariables({}, {}, { userId: 123 });
      expect(result.scenarioVariables).toEqual({ userId: 123 });
    });

    it('handles empty objects', () => {
      const result = mergeVariables({}, {}, {});
      expect(result).toEqual({
        globalVariables: {},
        scenarioVariables: {},
      });
    });

    it('preserves scenario variables when merging', () => {
      const result = mergeVariables(
        { projVar: 'a' },
        { svcVar: 'b' },
        { scenVar: 'c' }
      );
      expect(result).toEqual({
        globalVariables: { projVar: 'a', svcVar: 'b' },
        scenarioVariables: { scenVar: 'c' },
      });
    });
  });
});