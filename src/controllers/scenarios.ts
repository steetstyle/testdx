import { Project } from '../models/project';
import { Service } from '../models/service';
import { SyntheticScenario, DistributionType } from '../models/scenario';
import mongoose from 'mongoose';
import { CreateScenarioInput } from './types/synthetic';

export async function getScenarios(teamId: string, projectId?: string, serviceId?: string): Promise<any[]> {
  const query: any = { teamId };
  if (projectId) query.projectId = projectId;
  if (serviceId) query.serviceId = serviceId;
  const scenarios = await SyntheticScenario.find(query).sort({ createdAt: -1 }).lean();

  if (scenarios.length === 0) return scenarios;

  const projectIds = [...new Set(scenarios.map(s => s.projectId?.toString()).filter(Boolean))];
  const serviceIds = [...new Set(scenarios.map(s => s.serviceId?.toString()).filter(Boolean))];

  const projects = await Project.find({ _id: { $in: projectIds } }).lean();
  const services = await Service.find({ _id: { $in: serviceIds } }).lean();

  const projectMap = new Map(projects.map(p => [p._id.toString(), p]));
  const serviceMap = new Map(services.map(s => [s._id.toString(), s]));

  return scenarios.map(scenario => {
    const project = projectMap.get(scenario.projectId?.toString());
    const service = serviceMap.get(scenario.serviceId?.toString());
    return {
      ...scenario,
      project,
      service,
      projectVariables: project?.projectVariables || {},
      serviceVariables: service?.serviceVariables || {},
    };
  });
}

export async function getScenario(teamId: string, id: string): Promise<any | null> {
  const scenario = await SyntheticScenario.findOne({ teamId, _id: id }).lean();
  if (!scenario) return null;

  const service = scenario.serviceId ? await Service.findById(scenario.serviceId).lean() : null;
  const project = scenario.projectId ? await Project.findById(scenario.projectId).lean() : null;

  return {
    ...scenario,
    service,
    project,
    projectVariables: project?.projectVariables || {},
    serviceVariables: service?.serviceVariables || {},
  };
}

export async function createScenario(teamId: string, input: CreateScenarioInput): Promise<any> {
  const scenario = new SyntheticScenario({
    teamId: new mongoose.Types.ObjectId(teamId),
    projectId: new mongoose.Types.ObjectId(input.projectId),
    serviceId: new mongoose.Types.ObjectId(input.serviceId),
    name: input.name,
    description: input.description || '',
    telemetryType: input.telemetryType,
    params: input.params,
    attributes: input.attributes || {},
    distribution: input.distribution || { type: 'fixed', rate: 10 },
    variables: input.variables || {},
    schedule: input.schedule,
    limits: input.limits || { maxConcurrent: 1, maxPerHour: 100 },
    isActive: input.isActive || false,
    recentRuns: [],
  });
  return scenario.save();
}

export async function updateScenario(teamId: string, id: string, input: Partial<CreateScenarioInput>): Promise<any | null> {
  const updateData: any = { ...input };
  if (input.projectId) updateData.projectId = new mongoose.Types.ObjectId(input.projectId);
  if (input.serviceId) updateData.serviceId = new mongoose.Types.ObjectId(input.serviceId);

  return SyntheticScenario.findOneAndUpdate({ teamId, _id: id }, { $set: updateData }, { new: true });
}

export async function deleteScenario(teamId: string, id: string): Promise<void> {
  await SyntheticScenario.deleteOne({ teamId, _id: id });
}