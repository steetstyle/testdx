import axios from 'axios';
import type { 
  Project, Service, SyntheticScenario, 
  CreateProjectInput, CreateServiceInput, CreateScenarioInput, 
  RunScenarioInput, RunResult, ImportResult, RunProgress, DistributionConfig
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const teamId = localStorage.getItem('teamId') || '507f1f77bcf86cd799439011';
  config.headers['X-Team-ID'] = teamId;
  return config;
});

export const projectApi = {
  getProjects: async (): Promise<Project[]> => {
    const { data } = await api.get<Project[]>('/projects');
    return data;
  },

  getProject: async (id: string): Promise<Project> => {
    const { data } = await api.get<Project>(`/projects/${id}`);
    return data;
  },

  createProject: async (input: CreateProjectInput): Promise<Project> => {
    const { data } = await api.post<Project>('/projects', input);
    return data;
  },

  updateProject: async (id: string, input: Partial<CreateProjectInput>): Promise<Project> => {
    const { data } = await api.put<Project>(`/projects/${id}`, input);
    return data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  importFullYaml: async (yaml: string): Promise<any> => {
    const { data } = await api.post('/import/full', { yaml });
    return data;
  },

  getImportFiles: async (): Promise<{ files: Array<{ name: string; path: string; size: number }> }> => {
    const { data } = await api.get('/import/files');
    return data;
  },

  importFromFile: async (filename: string): Promise<any> => {
    const { data } = await api.post('/import/file', { filename });
    return data;
  },
};

export const serviceApi = {
  getServices: async (projectId: string): Promise<Service[]> => {
    const { data } = await api.get<Service[]>(`/projects/${projectId}/services`);
    return data;
  },

  getService: async (id: string): Promise<Service> => {
    const { data } = await api.get<Service>(`/services/${id}`);
    return data;
  },

  createService: async (input: CreateServiceInput): Promise<Service> => {
    const { data } = await api.post<Service>(`/projects/${input.projectId}/services`, input);
    return data;
  },

  updateService: async (id: string, input: Partial<CreateServiceInput>): Promise<Service> => {
    const { data } = await api.put<Service>(`/services/${id}`, input);
    return data;
  },

  deleteService: async (id: string): Promise<void> => {
    await api.delete(`/services/${id}`);
  },
};

export const scenarioApi = {
  getScenarios: async (projectId?: string, serviceId?: string): Promise<SyntheticScenario[]> => {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (serviceId) params.append('serviceId', serviceId);
    const { data } = await api.get<SyntheticScenario[]>(`/scenarios?${params}`);
    return data;
  },

  getScenario: async (id: string): Promise<SyntheticScenario> => {
    const { data } = await api.get<SyntheticScenario>(`/scenarios/${id}`);
    return data;
  },

  createScenario: async (input: CreateScenarioInput): Promise<SyntheticScenario> => {
    const { data } = await api.post<SyntheticScenario>('/scenarios', input);
    return data;
  },

  updateScenario: async (id: string, input: Partial<CreateScenarioInput>): Promise<SyntheticScenario> => {
    const { data } = await api.put<SyntheticScenario>(`/scenarios/${id}`, input);
    return data;
  },

  deleteScenario: async (id: string): Promise<void> => {
    await api.delete(`/scenarios/${id}`);
  },

  runScenario: async (id: string, input?: RunScenarioInput): Promise<RunResult> => {
    const { data } = await api.post<RunResult>(`/scenarios/${id}/run`, input || {});
    return data;
  },

  startSchedule: async (id: string): Promise<SyntheticScenario> => {
    const { data } = await api.post<SyntheticScenario>(`/scenarios/${id}/schedule/start`);
    return data;
  },

  stopScenario: async (id: string): Promise<{ success: boolean; error?: string }> => {
    const { data } = await api.post<{ success: boolean; error?: string }>(`/scenarios/${id}/stop`);
    return data;
  },

  stopSchedule: async (id: string): Promise<SyntheticScenario> => {
    const { data } = await api.post<SyntheticScenario>(`/scenarios/${id}/schedule/stop`);
    return data;
  },

  previewDistribution: async (distribution: DistributionConfig, scenarioDuration: number = 60, samples: number = 60): Promise<{ duration: number; samples: number; points: Array<{ time: number; rate: number }> }> => {
    const { data } = await api.post<{ duration: number; samples: number; points: Array<{ time: number; rate: number }> }>('/scenarios/preview-distribution', { 
      distribution,
      duration: scenarioDuration,
      samples 
    });
    return data;
  },

  getHistory: async (id: string): Promise<SyntheticScenario['recentRuns']> => {
    const { data } = await api.get<SyntheticScenario['recentRuns']>(`/scenarios/${id}/history`);
    return data;
  },

  getProgress: async (id: string): Promise<RunProgress | null> => {
    const { data } = await api.get<RunProgress | null>(`/scenarios/${id}/progress`);
    return data;
  },

  importYaml: async (yaml: string): Promise<ImportResult> => {
    const { data } = await api.post<ImportResult>('/scenarios/import/yaml', { yaml });
    return data;
  },
};

export const syntheticApi = {
  ...scenarioApi,
  getService: async (id: string): Promise<Service> => {
    const { data } = await api.get<Service>(`/services/${id}`);
    return data;
  },
};

export default { projectApi, serviceApi, scenarioApi };