import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScenarioSave } from '../../pages/ScenarioBuilder/hooks/useScenarioSave';

const mockCreateScenario = vi.fn();
const mockUpdateScenario = vi.fn();
const mockRunScenario = vi.fn();

vi.mock('../../services/api', () => ({
  syntheticApi: {
    createScenario: (...args: unknown[]) => mockCreateScenario(...args),
    updateScenario: (...args: unknown[]) => mockUpdateScenario(...args),
    runScenario: (...args: unknown[]) => mockRunScenario(...args),
  },
}));

describe('useScenarioSave', () => {
  const mockFormData = {
    name: 'Test Scenario',
    description: 'Test Description',
    telemetryType: 'unified' as const,
    includeTraces: true,
    includeMetrics: true,
    includeLogs: true,
    correlationEnabled: true,
    traceConfig: {
      spans: [{ id: 'span-1', name: 'root-operation', kind: 'server', statusCode: 'OK', attributes: {}, events: [], links: [], durationMs: 100 }],
      samplingRatio: 1.0,
    },
    metricConfig: {
      metrics: [{ name: 'requests', type: 'counter' as const, value: 1, unit: '1', labels: {} }],
      metricAttributes: {},
      temporality: 'cumulative' as const,
      aggregation: 'histogram' as const,
      readers: ['periodic'] as string[],
    },
    logConfig: {
      logs: [{ severityNumber: 9, severityText: 'Info', body: 'Request processed', attributes: {} }],
      logAttributes: {},
      includeTraceId: true,
      includeSpanId: true,
      includeResourceAttributes: true,
      includeLogLevel: true,
      includeSystemAttributes: false,
    },
    distribution: { type: 'uniform' as const, rate: 10, interval: '1s' },
    schedule: { enabled: false as const },
    variables: {},
    runMode: 'realtime' as const,
  };

  const mockOptions = {
    projectId: 'project-123',
    serviceId: 'service-456',
    isEditing: false,
    formData: mockFormData,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildParams', () => {
    it('builds params with default values', () => {
      const { result } = renderHook(() => useScenarioSave(mockOptions));
      const params = result.current.buildParams();

      expect(params.includeTraces).toBe(true);
      expect(params.includeMetrics).toBe(true);
      expect(params.includeLogs).toBe(true);
      expect(params.correlationEnabled).toBe(true);
      expect(params.rootSpan).toBeDefined();
      expect(params.metrics).toEqual(mockFormData.metricConfig.metrics);
      expect(params.logs).toEqual(mockFormData.logConfig.logs);
    });

    it('includes first span in rootSpan', () => {
      const { result } = renderHook(() => useScenarioSave(mockOptions));
      const params = result.current.buildParams();

      expect(params.rootSpan).toMatchObject({
        id: 'span-1',
        name: 'root-operation',
        kind: 'server',
        statusCode: 'OK',
      });
    });
  });

  describe('save', () => {
    it('creates new scenario when not editing', async () => {
      mockCreateScenario.mockResolvedValue({ _id: 'new-scenario-id' });
      const { result } = renderHook(() => useScenarioSave(mockOptions));

      await result.current.save();

      expect(mockCreateScenario).toHaveBeenCalledWith({
        projectId: 'project-123',
        serviceId: 'service-456',
        name: 'Test Scenario',
        description: 'Test Description',
        telemetryType: 'unified',
        params: expect.any(Object),
        distribution: mockFormData.distribution,
        schedule: mockFormData.schedule,
        variables: {},
        isActive: false,
      });
    });

    it('updates scenario when editing', async () => {
      mockUpdateScenario.mockResolvedValue({ _id: 'scenario-123' });
      const { result } = renderHook(() => useScenarioSave({
        ...mockOptions,
        isEditing: true,
        scenarioId: 'scenario-123',
      }));

      await result.current.save();

      expect(mockUpdateScenario).toHaveBeenCalledWith('scenario-123', expect.any(Object));
      expect(mockCreateScenario).not.toHaveBeenCalled();
    });

    it('activates scenario when activate is true', async () => {
      mockCreateScenario.mockResolvedValue({ _id: 'new-scenario-id' });
      const { result } = renderHook(() => useScenarioSave(mockOptions));

      await result.current.save(true);

      expect(mockCreateScenario).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true })
      );
    });
  });

  describe('run', () => {
    it('runs existing scenario when editing', async () => {
      mockRunScenario.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useScenarioSave({
        ...mockOptions,
        isEditing: true,
        scenarioId: 'scenario-123',
      }));

      const scenarioId = await result.current.run();

      expect(scenarioId).toBe('scenario-123');
      expect(mockRunScenario).toHaveBeenCalledWith('scenario-123', { mode: 'realtime' });
    });

    it('creates and runs new scenario when not editing', async () => {
      mockCreateScenario.mockResolvedValue({ _id: 'new-scenario-id' });
      mockRunScenario.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useScenarioSave(mockOptions));

      const scenarioId = await result.current.run();

      expect(scenarioId).toBe('new-scenario-id');
      expect(mockCreateScenario).toHaveBeenCalled();
      expect(mockRunScenario).toHaveBeenCalledWith('new-scenario-id', { mode: 'realtime' });
    });

    it('uses default name for new scenario when name is empty', async () => {
      mockCreateScenario.mockResolvedValue({ _id: 'new-scenario-id' });
      mockRunScenario.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useScenarioSave({
        ...mockOptions,
        formData: { ...mockFormData, name: '' },
      }));

      await result.current.run();

      expect(mockCreateScenario).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Untitled' })
      );
    });
  });

  describe('return shape', () => {
    it('returns all required methods', () => {
      const { result } = renderHook(() => useScenarioSave(mockOptions));

      expect(result.current).toHaveProperty('save');
      expect(result.current).toHaveProperty('run');
      expect(result.current).toHaveProperty('buildParams');
      expect(typeof result.current.save).toBe('function');
      expect(typeof result.current.run).toBe('function');
      expect(typeof result.current.buildParams).toBe('function');
    });
  });
});