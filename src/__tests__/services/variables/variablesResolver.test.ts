import { getProjectVariables, getServiceVariables, getMergedVariables } from '../../../services/syntheticRunner/variablesResolver';

jest.mock('../../../models/project', () => ({
  Project: {
    findById: jest.fn(),
  },
}));

jest.mock('../../../models/service', () => ({
  Service: {
    findById: jest.fn(),
  },
}));

describe('variablesResolver (syntheticRunner)', () => {
  const { Project } = require('../../../models/project');
  const { Service } = require('../../../models/service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProjectVariables', () => {
    it('should return projectVariables when project exists', async () => {
      const mockProject = {
        projectVariables: { env: 'production', region: 'us-west-2' },
      };
      (Project.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(mockProject) });

      const result = await getProjectVariables('project-123');

      expect(result).toEqual({ env: 'production', region: 'us-west-2' });
      expect(Project.findById).toHaveBeenCalledWith('project-123');
    });

    it('should return empty object when project not found', async () => {
      (Project.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(null) });

      const result = await getProjectVariables('non-existent');

      expect(result).toEqual({});
    });

    it('should return empty object when projectVariables is undefined', async () => {
      (Project.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve({}) });

      const result = await getProjectVariables('project-123');

      expect(result).toEqual({});
    });

    it('should return empty object when findById throws', async () => {
      (Project.findById as jest.Mock).mockReturnValue({ lean: () => Promise.reject(new Error('DB error')) });

      const result = await getProjectVariables('project-123');

      expect(result).toEqual({});
    });
  });

  describe('getServiceVariables', () => {
    it('should return serviceVariables when service exists', async () => {
      const mockService = {
        serviceVariables: { endpoint: 'http://api.example.com', timeout: 5000 },
      };
      (Service.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(mockService) });

      const result = await getServiceVariables('service-123');

      expect(result).toEqual({ endpoint: 'http://api.example.com', timeout: 5000 });
      expect(Service.findById).toHaveBeenCalledWith('service-123');
    });

    it('should return empty object when service not found', async () => {
      (Service.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(null) });

      const result = await getServiceVariables('non-existent');

      expect(result).toEqual({});
    });

    it('should return empty object when serviceVariables is undefined', async () => {
      (Service.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve({}) });

      const result = await getServiceVariables('service-123');

      expect(result).toEqual({});
    });

    it('should return empty object when findById throws', async () => {
      (Service.findById as jest.Mock).mockReturnValue({ lean: () => Promise.reject(new Error('DB error')) });

      const result = await getServiceVariables('service-123');

      expect(result).toEqual({});
    });
  });

  describe('getMergedVariables', () => {
    it('should return project and service variables merged', async () => {
      const mockProject = {
        projectVariables: { env: 'production', region: 'us-west-2' },
      };
      const mockService = {
        serviceVariables: { endpoint: 'http://api.example.com', timeout: 5000 },
      };
      (Project.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(mockProject) });
      (Service.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(mockService) });

      const result = await getMergedVariables('project-123', 'service-123');

      expect(result).toEqual({
        env: 'production',
        region: 'us-west-2',
        endpoint: 'http://api.example.com',
        timeout: 5000,
      });
    });

    it('should prioritize service vars over project vars with same key', async () => {
      const mockProject = {
        projectVariables: { env: 'production', region: 'us-west-2', timeout: 3000 },
      };
      const mockService = {
        serviceVariables: { env: 'staging', timeout: 5000 },
      };
      (Project.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(mockProject) });
      (Service.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(mockService) });

      const result = await getMergedVariables('project-123', 'service-123');

      expect(result).toEqual({
        env: 'staging',
        region: 'us-west-2',
        timeout: 5000,
      });
    });

    it('should handle projectId only', async () => {
      const mockProject = {
        projectVariables: { env: 'production' },
      };
      (Project.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(mockProject) });

      const result = await getMergedVariables('project-123', undefined);

      expect(result).toEqual({ env: 'production' });
      expect(Service.findById).not.toHaveBeenCalled();
    });

    it('should handle serviceId only', async () => {
      const mockService = {
        serviceVariables: { endpoint: 'http://api.example.com' },
      };
      (Service.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(mockService) });

      const result = await getMergedVariables(undefined, 'service-123');

      expect(result).toEqual({ endpoint: 'http://api.example.com' });
      expect(Project.findById).not.toHaveBeenCalled();
    });

    it('should handle neither projectId nor serviceId', async () => {
      const result = await getMergedVariables(undefined, undefined);

      expect(result).toEqual({});
    });

    it('should handle empty project and service', async () => {
      (Project.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(null) });
      (Service.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(null) });

      const result = await getMergedVariables('project-123', 'service-123');

      expect(result).toEqual({});
    });

    it('should handle projectId as ObjectId', async () => {
      const mockProject = {
        projectVariables: { env: 'production' },
      };
      const objectIdMock = { toString: () => 'project-123' };
      (Project.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(mockProject) });

      const result = await getMergedVariables(objectIdMock as any, undefined);

      expect(result).toEqual({ env: 'production' });
      expect(Project.findById).toHaveBeenCalled();
    });

    it('should handle serviceId as ObjectId', async () => {
      const mockService = {
        serviceVariables: { timeout: 5000 },
      };
      const objectIdMock = { toString: () => 'service-123' };
      (Service.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(mockService) });

      const result = await getMergedVariables(undefined, objectIdMock as any);

      expect(result).toEqual({ timeout: 5000 });
      expect(Service.findById).toHaveBeenCalled();
    });
  });
});