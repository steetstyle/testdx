import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOTelConfig, defaultOTelConfig } from '../../components/OTelConfig/useOTelConfig';
import type { OtelSdkConfig } from '../../types';

vi.mock('@mantine/hooks', () => ({
  useDisclosure: (initialState = false) => [initialState, { open: vi.fn(), close: vi.fn(), toggle: vi.fn() }],
}));

describe('batchConfig Persistence - E2E Simulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deep merge behavior ensures batchConfig persistence', () => {
    it('updating maxQueueSize preserves other batchConfig fields', () => {
      const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
      
      act(() => {
        result.current.updateNested('trace', 'batchConfig', { maxQueueSize: 4096 });
      });
      
      expect(result.current.config.trace.batchConfig).toEqual({
        maxQueueSize: 4096,
        maxExportBatchSize: 512,
        scheduledDelay: 5000,
        exportTimeout: 30000,
      });
    });

    it('updating scheduledDelay preserves other batchConfig fields', () => {
      const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
      
      act(() => {
        result.current.updateNested('trace', 'batchConfig', { scheduledDelay: 10000 });
      });
      
      expect(result.current.config.trace.batchConfig).toEqual({
        maxQueueSize: 2048,
        maxExportBatchSize: 512,
        scheduledDelay: 10000,
        exportTimeout: 30000,
      });
    });

    it('updating maxExportBatchSize preserves other batchConfig fields', () => {
      const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
      
      act(() => {
        result.current.updateNested('trace', 'batchConfig', { maxExportBatchSize: 1024 });
      });
      
      expect(result.current.config.trace.batchConfig).toEqual({
        maxQueueSize: 2048,
        maxExportBatchSize: 1024,
        scheduledDelay: 5000,
        exportTimeout: 30000,
      });
    });

    it('updating exportTimeout preserves other batchConfig fields', () => {
      const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
      
      act(() => {
        result.current.updateNested('trace', 'batchConfig', { exportTimeout: 60000 });
      });
      
      expect(result.current.config.trace.batchConfig).toEqual({
        maxQueueSize: 2048,
        maxExportBatchSize: 512,
        scheduledDelay: 5000,
        exportTimeout: 60000,
      });
    });

    it('simulates full save/load cycle for batchConfig', () => {
      const { result: hook1 } = renderHook(() => useOTelConfig(defaultOTelConfig));
      
      act(() => {
        hook1.current.updateNested('trace', 'batchConfig', { maxQueueSize: 4096, scheduledDelay: 10000 });
      });
      
      const savedConfig = JSON.stringify(hook1.current.config);
      const loadedConfig = JSON.parse(savedConfig) as OtelSdkConfig;
      
      const { result: hook2 } = renderHook(() => useOTelConfig(loadedConfig));
      
      expect(hook2.current.config.trace.batchConfig).toEqual({
        maxQueueSize: 4096,
        maxExportBatchSize: 512,
        scheduledDelay: 10000,
        exportTimeout: 30000,
      });
    });

    it('simulates API payload with partial batchConfig update', () => {
      const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
      
      act(() => {
        result.current.updateNested('trace', 'batchConfig', { maxQueueSize: 8192 });
      });
      
      const apiPayload = {
        trace: {
          batchConfig: result.current.config.trace.batchConfig,
        },
      };
      
      expect(apiPayload.trace.batchConfig).toEqual({
        maxQueueSize: 8192,
        maxExportBatchSize: 512,
        scheduledDelay: 5000,
        exportTimeout: 30000,
      });
    });
  });

  describe('spanLimits deep merge ensures persistence', () => {
    it('updating maxNumberOfAttributes preserves other spanLimits fields', () => {
      const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
      
      act(() => {
        result.current.updateNested('trace', 'spanLimits', { maxNumberOfAttributes: 500 });
      });
      
      expect(result.current.config.trace.spanLimits).toEqual({
        maxNumberOfAttributes: 500,
        maxNumberOfAttributesPerSpan: 128,
        maxNumberOfEvents: 100,
        maxNumberOfLinks: 100,
        maxNumberOfAttributesPerEvent: 32,
        maxNumberOfAttributesPerLink: 32,
        maxAttributeValueLength: 4096,
      });
    });

    it('simulates full save/load cycle for spanLimits', () => {
      const { result: hook1 } = renderHook(() => useOTelConfig(defaultOTelConfig));
      
      act(() => {
        hook1.current.updateNested('trace', 'spanLimits', { 
          maxNumberOfAttributes: 2000,
          maxNumberOfEvents: 500 
        });
      });
      
      const savedConfig = JSON.stringify(hook1.current.config);
      const loadedConfig = JSON.parse(savedConfig) as OtelSdkConfig;
      
      const { result: hook2 } = renderHook(() => useOTelConfig(loadedConfig));
      
      expect(hook2.current.config.trace.spanLimits.maxNumberOfAttributes).toBe(2000);
      expect(hook2.current.config.trace.spanLimits.maxNumberOfEvents).toBe(500);
      expect(hook2.current.config.trace.spanLimits.maxNumberOfAttributesPerSpan).toBe(128);
    });
  });
});