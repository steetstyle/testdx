import { Project } from '../models/project';
import mongoose from 'mongoose';
import { CreateProjectInput } from './types/synthetic';

export async function getProjects(teamId: string): Promise<any[]> {
  return Project.find({ teamId }).sort({ createdAt: -1 }).lean();
}

export async function getProject(teamId: string, id: string): Promise<any | null> {
  return Project.findOne({ teamId, _id: id }).lean();
}

export async function createProject(teamId: string, input: CreateProjectInput): Promise<any> {
  const project = new Project({
    teamId: new mongoose.Types.ObjectId(teamId),
    name: input.name,
    description: input.description || '',
    otelCollectorEndpoint: input.otelCollectorEndpoint || 'http://localhost:4318',
    isActive: true,
  });
  return project.save();
}

export async function updateProject(teamId: string, id: string, input: Partial<CreateProjectInput & { projectVariables?: Record<string, any> }>): Promise<any | null> {
  const { projectVariables, ...rest } = input;
  const updateData: Record<string, any> = { ...rest };
  if (projectVariables !== undefined) {
    updateData.projectVariables = projectVariables;
  }
  return Project.findOneAndUpdate({ teamId, _id: id }, { $set: updateData }, { new: true });
}

export async function deleteProject(teamId: string, id: string): Promise<void> {
  const { Service } = require('../models/service');
  const { SyntheticScenario } = require('../models/scenario');
  await Service.deleteMany({ projectId: id });
  await SyntheticScenario.deleteMany({ projectId: id });
  await Project.deleteOne({ teamId, _id: id });
}