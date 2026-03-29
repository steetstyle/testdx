import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLoadScenario } from '../../pages/ScenarioBuilder/hooks/useLoadScenario';

const mockGetScenario = vi.fn();
const mockGetService = vi.fn();

vi.mock('../../services/api', () => ({
  syntheticApi: {
    getScenario: (...args: unknown[]) => mockGetScenario(...args),
    getService: (...args: unknown[]) => mockGetService(...args),
  },
}));

describe('useLoadScenario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('initializes with empty variables and null config', () => {
      const { result } = renderHook(() => useLoadScenario());
      expect(result.current.projectVariables).toEqual({});
      expect(result.current.serviceVariables).toEqual({});
      expect(result.current.serviceConfig).toBeNull();
    });
  });

  describe('loadScenario', () => {
    const mockScenario = {
      _id: 'scenario-123',
      name: 'Test Scenario',
      description: 'Test Description',
      telemetryType: 'unified',
      params: {
        rootSpan: {
          id: 'span-1',
          name: 'operation',
          kind: 'server',
          statusCode: 'Ok',
          attributes: { key: 'value' },
          events: [],
          links: [],
          durationMs: 100,
        },
        metrics: [{ name: 'test_metric', type: 'counter', value: 1 }],
        logs: [{ severityNumber: 9, severityText: 'Info', body: 'test', attributes: {} }],
        includeTraces: true,
        includeMetrics: true,
        includeLogs: true,
        correlationEnabled: true,
      },
      distribution: { type: 'uniform', rate: 20 },
      schedule: { enabled: true, cronExpression: '0 * * * *' },
      variables: { VAR1: 'value1' },
      projectVariables: { PROJ_VAR: 'proj_value' },
      serviceVariables: { SVC_VAR: 'svc_value' },
    };

    it('loads scenario and transforms to form data', async () => {
      mockGetScenario.mockResolvedValueOnce(mockScenario);
      const { result } = renderHook(() => useLoadScenario());

      const formData = await result.current.loadScenario('scenario-123');

      expect(formData.name).toBe('Test Scenario');
      expect(formData.description).toBe('Test Description');
      expect(formData.telemetryType).toBe('unified');
      expect(formData.includeTraces).toBe(true);
      expect(formData.includeMetrics).toBe(true);
      expect(formData.includeLogs).toBe(true);
      expect(formData.correlationEnabled).toBe(true);
    });

    it('loads trace config from params', async () => {
      mockGetScenario.mockResolvedValueOnce(mockScenario);
      const { result } = renderHook(() => useLoadScenario());

      const formData = await result.current.loadScenario('scenario-123');

      expect(formData.traceConfig.spans).toHaveLength(1);
      expect(formData.traceConfig.spans[0].name).toBe('operation');
      expect(formData.traceConfig.spans[0].kind).toBe('server');
      expect(formData.traceConfig.spans[0].attributes).toEqual({ key: 'value' });
    });

    it('loads metric config from params', async () => {
      mockGetScenario.mockResolvedValueOnce(mockScenario);
      const { result } = renderHook(() => useLoadScenario());

      const formData = await result.current.loadScenario('scenario-123');

      expect(formData.metricConfig.metrics).toEqual([{ name: 'test_metric', type: 'counter', value: 1 }]);
    });

    it('loads distribution and schedule', async () => {
      mockGetScenario.mockResolvedValueOnce(mockScenario);
      const { result } = renderHook(() => useLoadScenario());

      const formData = await result.current.loadScenario('scenario-123');

      expect(formData.distribution).toEqual({ type: 'uniform', rate: 20 });
      expect(formData.schedule).toEqual({ enabled: true, cronExpression: '0 * * * *' });
    });

    it('loads scenario variables', async () => {
      mockGetScenario.mockResolvedValueOnce(mockScenario);
      const { result } = renderHook(() => useLoadScenario());

      const formData = await result.current.loadScenario('scenario-123');

      expect(formData.variables).toEqual({ VAR1: 'value1' });
    });

    it('sets project and service variables in state', async () => {
      mockGetScenario.mockResolvedValueOnce(mockScenario);
      const { result } = renderHook(() => useLoadScenario());

      await result.current.loadScenario('scenario-123');

      await waitFor(() => {
        expect(result.current.projectVariables).toEqual({ PROJ_VAR: 'proj_value' });
        expect(result.current.serviceVariables).toEqual({ SVC_VAR: 'svc_value' });
      });
    });

    it('uses defaults when params are missing', async () => {
      const minimalScenario = {
        _id: 'scenario-123',
        name: 'Minimal',
        description: '',
        telemetryType: 'traces',
        params: {},
      };
      mockGetScenario.mockResolvedValueOnce(minimalScenario);
      const { result } = renderHook(() => useLoadScenario());

      const formData = await result.current.loadScenario('scenario-123');

      expect(formData.traceConfig.spans).toHaveLength(1);
      expect(formData.metricConfig.metrics).toHaveLength(1);
      expect(formData.logConfig.logs).toHaveLength(1);
      expect(formData.schedule).toEqual({ enabled: false });
      expect(formData.variables).toEqual({});
    });
  });

  describe('loadService', () => {
    const mockService = {
      _id: 'service-456',
      name: 'Test Service',
      otelSdkConfig: { sdkName: 'test-sdk' },
      serviceVariables: { SVC_VAR: 'service_value' },
      project: {
        projectVariables: { PROJ_VAR: 'project_value' },
      },
    };

    it('loads service config', async () => {
      mockGetService.mockResolvedValueOnce(mockService);
      const { result } = renderHook(() => useLoadScenario());

      await result.current.loadService('service-456');

      await waitFor(() => {
        expect(result.current.serviceConfig).toEqual({ sdkName: 'test-sdk' });
      });
    });

    it('loads service and project variables', async () => {
      mockGetService.mockResolvedValueOnce(mockService);
      const { result } = renderHook(() => useLoadScenario());

      await result.current.loadService('service-456');

      await waitFor(() => {
        expect(result.current.serviceVariables).toEqual({ SVC_VAR: 'service_value' });
        expect(result.current.projectVariables).toEqual({ PROJ_VAR: 'project_value' });
      });
    });

    it('handles service without otelSdkConfig', async () => {
      const serviceWithoutConfig = {
        _id: 'service-456',
        name: 'Minimal Service',
      };
      mockGetService.mockResolvedValueOnce(serviceWithoutConfig);
      const { result } = renderHook(() => useLoadScenario());

      await result.current.loadService('service-456');

      expect(result.current.serviceConfig).toBeNull();
    });
  });

  describe('return shape', () => {
    it('returns all required properties and methods', () => {
      const { result } = renderHook(() => useLoadScenario());

      expect(result.current).toHaveProperty('loadScenario');
      expect(result.current).toHaveProperty('loadService');
      expect(result.current).toHaveProperty('projectVariables');
      expect(result.current).toHaveProperty('serviceVariables');
      expect(result.current).toHaveProperty('serviceConfig');
      expect(typeof result.current.loadScenario).toBe('function');
      expect(typeof result.current.loadService).toBe('function');
    });
  });
});