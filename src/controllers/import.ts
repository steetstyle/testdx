import { Project } from '../models/project';
import { Service, defaultOtelSdkConfig, OtelProtocol, CompressionType, SamplerType, SpanProcessorType } from '../models/service';
import { SyntheticScenario, TelemetryType, DistributionType } from '../models/scenario';
import mongoose from 'mongoose';
import { CreateScenarioInput, FullYamlConfig } from './types/synthetic';
import { OtelSdkConfig } from '../models/otel';

export function parseYamlConfig(yamlContent: string): CreateScenarioInput[] {
  const yaml = require('js-yaml');
  let parsed: any;
  try { parsed = yaml.load(yamlContent); } catch (e) { throw new Error(`Invalid YAML: ${e}`); }
  if (!parsed) throw new Error('Empty YAML content');
  if (Array.isArray(parsed)) return parsed;
  if (parsed.scenarios && Array.isArray(parsed.scenarios)) return parsed.scenarios;
  return [parsed];
}

function parseFullYamlConfig(yamlContent: string): FullYamlConfig {
  const yaml = require('js-yaml');
  let parsed: FullYamlConfig;
  try {
    parsed = yaml.load(yamlContent);
  } catch (e) {
    throw new Error(`Invalid YAML: ${e}`);
  }
  if (!parsed) throw new Error('Empty YAML content');
  return parsed;
}

export async function importFromYaml(teamId: string, yamlContent: string): Promise<{ imported: number; scenarios: any[] }> {
  const parsedScenarios = parseYamlConfig(yamlContent);
  const validScenarios = parsedScenarios.map((s: any) => ({
    ...s,
    params: s.params || { count: 100, childSpans: 2, duration: '150ms', statusCode: 'OK' },
  }));

  const docs = validScenarios.map((input: any) => ({
    teamId: new mongoose.Types.ObjectId(teamId),
    projectId: input.projectId ? new mongoose.Types.ObjectId(input.projectId) : null,
    serviceId: input.serviceId ? new mongoose.Types.ObjectId(input.serviceId) : null,
    name: input.name,
    description: input.description || '',
    telemetryType: input.telemetryType,
    params: input.params,
    attributes: input.attributes || {},
    distribution: input.distribution || { type: 'fixed', rate: 10 },
    schedule: input.schedule,
    limits: input.limits || { maxConcurrent: 1, maxPerHour: 100 },
    isActive: input.isActive || false,
    recentRuns: [],
  }));

  const result = await SyntheticScenario.insertMany(docs);
  return { imported: result.length, scenarios: result };
}

export async function importFromFullYaml(teamId: string, yamlContent: string): Promise<{
  project?: any;
  services?: any[];
  scenarios?: any[];
  imported: number;
}> {
  try {
    console.log('[importFromFullYaml] Parsing YAML...');
    const config = parseFullYamlConfig(yamlContent);
    console.log('[importFromFullYaml] YAML parsed. Services:', config.services?.length);

    const projectName = config.name || config.project?.name || 'Imported Project';
    const projectDesc = config.description || config.project?.description || '';
    const otelEndpoint = config.otelCollectorEndpoint || config.project?.otelCollectorEndpoint || 'http://localhost:4318';
    const projVars = config.projectVariables || config.variables || {};
    console.log('[importFromFullYaml] Project vars:', JSON.stringify(projVars).substring(0, 200));

    const { createProject } = require('./projects');
    console.log('[importFromFullYaml] Creating project...');
    const project = await createProject(teamId, {
      name: projectName,
      description: projectDesc,
      otelCollectorEndpoint: otelEndpoint,
    });
    console.log('[importFromFullYaml] Project created:', project._id);

    await Project.findByIdAndUpdate(project._id, { projectVariables: projVars });
    console.log('[importFromFullYaml] Project variables updated');

    let allScenarios: any[] = [];
    let services: any[] = [];

    if (config.services && Array.isArray(config.services)) {
      const { createService } = require('./services');
      const { createScenario } = require('./scenarios');

      for (let si = 0; si < config.services.length; si++) {
        const svc = config.services[si];
        console.log(`[importFromFullYaml] Processing service ${si}:`, svc.name);

        const serviceVars = svc.serviceVariables || svc.variables || {};
        console.log('[importFromFullYaml] Service vars:', JSON.stringify(serviceVars).substring(0, 200));

        const existingTraceConfig = (svc.otelSdkConfig?.trace || {}) as Record<string, unknown>;
        const serviceOtelConfig: OtelSdkConfig = {
          ...svc.otelSdkConfig,
          trace: {
            enabled: true,
            serviceName: svc.name || 'synthetic-service',
            instrumentationScopeName: 'testdx',
            instrumentationScopeVersion: '1.0.0',
            protocol: OtelProtocol.HTTP,
            endpoint: (existingTraceConfig.endpoint as string) || otelEndpoint || 'http://localhost:4318',
            timeout: 30000,
            compression: CompressionType.GZIP,
            resourceAttributes: {},
            samplerType: SamplerType.PARENT_BASED_TRACE_ID,
            samplerParam: 1.0,
            spanLimits: {
              maxNumberOfAttributes: 1000,
              maxNumberOfAttributesPerSpan: 128,
              maxNumberOfEvents: 100,
              maxNumberOfLinks: 100,
              maxNumberOfAttributesPerEvent: 32,
              maxNumberOfAttributesPerLink: 32,
              maxAttributeValueLength: 4096,
            },
            spanProcessor: SpanProcessorType.BATCH,
            exporters: [],
            ...existingTraceConfig,
          },
        } as OtelSdkConfig;

        const service = await createService(teamId, {
          projectId: project._id.toString(),
          name: svc.name || 'default-service',
          description: svc.description || '',
          otelSdkConfig: serviceOtelConfig,
        });
        console.log('[importFromFullYaml] Service created:', service._id, 'with endpoint:', serviceOtelConfig.trace.endpoint);

        await Service.findByIdAndUpdate(service._id, { serviceVariables: serviceVars });
        services.push(service);

        if (svc.scenarios && Array.isArray(svc.scenarios)) {
          for (let sci = 0; sci < svc.scenarios.length; sci++) {
            const scen = svc.scenarios[sci];
            console.log(`[importFromFullYaml] Creating scenario ${sci}:`, scen.name);
            console.log('[importFromFullYaml] Scenario variables:', JSON.stringify(scen.variables || {}).substring(0, 200));

            const scenario = await createScenario(teamId, {
              projectId: project._id.toString(),
              serviceId: service._id.toString(),
              name: scen.name,
              description: scen.description || '',
              telemetryType: scen.telemetryType || TelemetryType.TRACES,
              params: scen.params,
              attributes: scen.attributes || {},
              distribution: scen.distribution,
              variables: scen.variables || svc.variables || config.variables,
              schedule: scen.schedule,
              limits: scen.limits,
              isActive: scen.isActive || false,
            });
            allScenarios.push(scenario);
            console.log('[importFromFullYaml] Scenario created:', scenario._id);
          }
        }
      }
    }

    return {
      project,
      services,
      scenarios: allScenarios,
      imported: allScenarios.length,
    };
  } catch (e: any) {
    console.error('[importFromFullYaml] ERROR:', e.message);
    console.error('[importFromFullYaml] Stack:', e.stack);
    throw e;
  }
}