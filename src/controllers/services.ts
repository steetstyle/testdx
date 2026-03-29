import { Service, defaultOtelSdkConfig, OtelSdkConfig } from '../models/service';
import { Project } from '../models/project';
import mongoose from 'mongoose';
import { deepMerge } from './utils/deepMerge';
import { CreateServiceInput } from './types/synthetic';

export async function getServices(teamId: string, projectId: string): Promise<any[]> {
  return Service.find({ projectId }).sort({ createdAt: -1 }).lean();
}

export async function getService(teamId: string, id: string): Promise<any | null> {
  const service = await Service.findById(id).lean();
  if (!service) return null;
  const project = await Project.findById(service.projectId).lean();
  return { ...service, project };
}

export async function createService(teamId: string, input: CreateServiceInput): Promise<any> {
  const service = new Service({
    projectId: new mongoose.Types.ObjectId(input.projectId),
    name: input.name,
    description: input.description || '',
    otelSdkConfig: input.otelSdkConfig || defaultOtelSdkConfig,
    isActive: true,
  });
  return service.save();
}

export async function updateService(teamId: string, id: string, input: Partial<CreateServiceInput & { serviceVariables?: Record<string, any> }>): Promise<any | null> {
  const service = await Service.findById(id);
  if (!service) return null;

  if (input.otelSdkConfig) {
    service.otelSdkConfig = deepMerge(service.otelSdkConfig as any, input.otelSdkConfig) as OtelSdkConfig;
  }
  if (input.name) service.name = input.name;
  if (input.description !== undefined) service.description = input.description;
  if (input.serviceVariables !== undefined) {
    service.serviceVariables = input.serviceVariables;
  }

  return service.save();
}

export async function deleteService(teamId: string, id: string): Promise<void> {
  const { SyntheticScenario } = require('../models/scenario');
  await SyntheticScenario.deleteMany({ serviceId: id });
  await Service.deleteOne({ _id: id });
}