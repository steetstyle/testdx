import { Project } from '../../models/project';
import { Service } from '../../models/service';

export async function getProjectVariables(projectId: string): Promise<Record<string, any>> {
  try {
    const project = await Project.findById(projectId).lean();
    return project?.projectVariables || {};
  } catch {
    return {};
  }
}

export async function getServiceVariables(serviceId: string): Promise<Record<string, any>> {
  try {
    const service = await Service.findById(serviceId).lean();
    return service?.serviceVariables || {};
  } catch {
    return {};
  }
}

export async function getMergedVariables(
  projectId: string | undefined,
  serviceId: string | undefined
): Promise<Record<string, any>> {
  const projectIdStr = projectId?.toString();
  const serviceIdStr = serviceId?.toString();

  const projectVariables = projectIdStr ? await getProjectVariables(projectIdStr) : {};
  const serviceVariables = serviceIdStr ? await getServiceVariables(serviceIdStr) : {};

  return { ...projectVariables, ...serviceVariables };
}