import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOTelConfig, defaultOTelConfig } from '../../components/OTelConfig/useOTelConfig';
import type { OtelSdkConfig } from '../../types';

vi.mock('@mantine/hooks', () => ({
  useDisclosure: (initialState = false) => [initialState, { open: vi.fn(), close: vi.fn(), toggle: vi.fn() }],
}));

describe('useOTelConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default config when value is undefined', () => {
    const { result } = renderHook(() => useOTelConfig(undefined as unknown as OtelSdkConfig));
    expect(result.current.config).toEqual(defaultOTelConfig);
  });

  it('initializes with provided value', () => {
    const initialConfig: OtelSdkConfig = {
      ...defaultOTelConfig,
      resource: {
        serviceName: 'custom-service',
        serviceNamespace: '',
        serviceInstanceId: '',
        serviceVersion: '',
        deploymentEnvironment: '',
        attributes: {},
      },
    } as OtelSdkConfig;
    
    const { result } = renderHook(() => useOTelConfig(initialConfig));
    expect(result.current.config.resource.serviceName).toBe('custom-service');
  });

  describe('updateConfig', () => {
    it('updates top-level config field', () => {
      const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
      
      act(() => {
        result.current.updateConfig('sdkName', 'custom-sdk');
      });
      
      expect(result.current.config.sdkName).toBe('custom-sdk');
    });

    it('updates nested resource field', () => {
      const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
      
      act(() => {
        result.current.updateConfig('resource.serviceName', 'my-service');
      });
      
      expect(result.current.config.resource.serviceName).toBe('my-service');
    });

    it('updates deeply nested fields', () => {
      const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
      
      act(() => {
        result.current.updateConfig('trace.spanLimits.maxNumberOfAttributes', 500);
      });
      
      expect(result.current.config.trace.spanLimits.maxNumberOfAttributes).toBe(500);
    });
  });

  describe('updateNested', () => {
    it('updates a section with new field value', () => {
      const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
      
      act(() => {
        result.current.updateNested('trace', 'enabled', false);
      });
      
      expect(result.current.config.trace.enabled).toBe(false);
    });

    it('preserves other section fields when updating', () => {
      const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
      const originalEndpoint = result.current.config.trace.endpoint;
      
      act(() => {
        result.current.updateNested('trace', 'serviceName', 'new-service');
      });
      
      expect(result.current.config.trace.serviceName).toBe('new-service');
      expect(result.current.config.trace.endpoint).toBe(originalEndpoint);
    });

    it('updates metric section', () => {
      const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
      
      act(() => {
        result.current.updateNested('metric', 'temporality', 'delta');
      });
      
      expect(result.current.config.metric.temporality).toBe('delta');
    });

    it('updates log section', () => {
      const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
      
      act(() => {
        result.current.updateNested('log', 'includeTraceId', false);
      });
      
      expect(result.current.config.log.includeTraceId).toBe(false);
    });

    describe('deep merge for nested objects', () => {
      it('deep merges batchConfig when updating maxQueueSize', () => {
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

      it('deep merges batchConfig when updating scheduledDelay', () => {
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

      it('deep merges spanLimits when updating maxNumberOfAttributes', () => {
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

      it('deep merges spanLimits when updating multiple fields sequentially', () => {
        const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
        
        act(() => {
          result.current.updateNested('trace', 'spanLimits', { maxNumberOfAttributes: 500 });
        });
        
        act(() => {
          result.current.updateNested('trace', 'spanLimits', { maxNumberOfEvents: 200 });
        });
        
        expect(result.current.config.trace.spanLimits).toEqual({
          maxNumberOfAttributes: 500,
          maxNumberOfAttributesPerSpan: 128,
          maxNumberOfEvents: 200,
          maxNumberOfLinks: 100,
          maxNumberOfAttributesPerEvent: 32,
          maxNumberOfAttributesPerLink: 32,
          maxAttributeValueLength: 4096,
        });
      });

      it('handles undefined existing nested object', () => {
        const configWithoutBatchConfig = JSON.parse(JSON.stringify(defaultOTelConfig)) as OtelSdkConfig;
        configWithoutBatchConfig.trace!.batchConfig = undefined as any;
        
        const { result } = renderHook(() => useOTelConfig(configWithoutBatchConfig));
        
        act(() => {
          result.current.updateNested('trace', 'batchConfig', { maxQueueSize: 4096 });
        });
        
        expect(result.current.config.trace.batchConfig?.maxQueueSize).toBe(4096);
      });

      it('handles undefined existing spanLimits', () => {
        const configWithoutLimits = JSON.parse(JSON.stringify(defaultOTelConfig)) as OtelSdkConfig;
        configWithoutLimits.trace!.spanLimits = undefined as any;
        
        const { result } = renderHook(() => useOTelConfig(configWithoutLimits));
        
        act(() => {
          result.current.updateNested('trace', 'spanLimits', { maxNumberOfAttributes: 500 });
        });
        
        expect(result.current.config.trace.spanLimits?.maxNumberOfAttributes).toBe(500);
      });
    });
  });

  describe('setConfig', () => {
    it('replaces entire config', () => {
      const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
      const newConfig: OtelSdkConfig = {
        ...defaultOTelConfig,
        resource: {
          serviceName: 'completely-new',
          serviceNamespace: 'ns',
          serviceInstanceId: 'id',
          serviceVersion: 'v1',
          deploymentEnvironment: 'prod',
          attributes: {},
        },
      } as OtelSdkConfig;
      
      act(() => {
        result.current.setConfig(newConfig);
      });
      
      expect(result.current.config.resource.serviceName).toBe('completely-new');
      expect(result.current.config.sdkName).toBe('opentelemetry-js');
    });
  });

  it('returns all required methods', () => {
    const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
    
    expect(result.current).toHaveProperty('config');
    expect(result.current).toHaveProperty('updateConfig');
    expect(result.current).toHaveProperty('updateNested');
    expect(result.current).toHaveProperty('setConfig');
    expect(typeof result.current.updateConfig).toBe('function');
    expect(typeof result.current.updateNested).toBe('function');
    expect(typeof result.current.setConfig).toBe('function');
  });
});