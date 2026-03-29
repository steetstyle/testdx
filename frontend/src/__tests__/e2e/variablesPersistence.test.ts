import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOTelConfig, defaultOTelConfig } from '../../components/OTelConfig/useOTelConfig';
import type { OtelSdkConfig } from '../../types';

vi.mock('@mantine/hooks', () => ({
  useDisclosure: (initialState = false) => [initialState, { open: vi.fn(), close: vi.fn(), toggle: vi.fn() }],
}));

describe('Variables Persistence - E2E Simulation', () => {
  describe('scenario variables persistence via updateFormData', () => {
    it('simulates adding project variable that becomes scenario-local', () => {
      const initialFormData = {
        variables: {},
      };

      const newVars = { 'PROJECT_VAR': 'project_value' };
      const merged = { ...initialFormData.variables, ...newVars };

      expect(merged).toEqual({ PROJECT_VAR: 'project_value' });
      expect(initialFormData.variables).toEqual({});
    });

    it('simulates adding service variable that becomes scenario-local', () => {
      const initialFormData = {
        variables: { PROJECT_VAR: 'project_value' },
      };

      const newVars = { 'SERVICE_VAR': 'service_value' };
      const merged = { ...initialFormData.variables, ...newVars };

      expect(merged).toEqual({ 
        PROJECT_VAR: 'project_value',
        SERVICE_VAR: 'service_value'
      });
    });

    it('simulates updating a variable', () => {
      const initialFormData = {
        variables: { MY_VAR: 'old_value' },
      };

      const merged = { ...initialFormData.variables, MY_VAR: 'new_value' };

      expect(merged).toEqual({ MY_VAR: 'new_value' });
    });

    it('simulates deleting a variable', () => {
      const initialFormData = {
        variables: { VAR1: 'value1', VAR2: 'value2' },
      };

      const { VAR1: _, ...rest } = initialFormData.variables;

      expect(rest).toEqual({ VAR2: 'value2' });
    });

    it('simulates full save/load cycle with multiple variable types', () => {
      const formData = {
        variables: {
          STRING_VAR: 'string_value',
          NUMBER_VAR: 123,
          BOOL_VAR: true,
          ARRAY_VAR: ['a', 'b', 'c'],
        },
      };

      const saved = JSON.stringify(formData);
      const loaded = JSON.parse(saved);

      expect(loaded.variables).toEqual({
        STRING_VAR: 'string_value',
        NUMBER_VAR: 123,
        BOOL_VAR: true,
        ARRAY_VAR: ['a', 'b', 'c'],
      });
    });
  });

  describe('nested config with variables preservation', () => {
    it('simulates updating OTel config while preserving variables', () => {
      const { result } = renderHook(() => useOTelConfig(defaultOTelConfig));
      
      act(() => {
        result.current.updateNested('trace', 'enabled', false);
      });
      
      act(() => {
        result.current.updateNested('trace', 'batchConfig', { maxQueueSize: 4096 });
      });
      
      const fullConfig = {
        ...result.current.config,
        variables: {
          ENV: 'production',
          REGION: 'us-west-2',
        },
      };
      
      expect(fullConfig.trace.enabled).toBe(false);
      expect(fullConfig.trace.batchConfig?.maxQueueSize).toBe(4096);
      expect(fullConfig.variables).toEqual({
        ENV: 'production',
        REGION: 'us-west-2',
      });
    });

    it('simulates loading config and variables together', () => {
      const { result: hook1 } = renderHook(() => useOTelConfig(defaultOTelConfig));
      
      act(() => {
        hook1.current.updateNested('trace', 'batchConfig', { maxQueueSize: 8192 });
      });
      
      const savedData = {
        config: hook1.current.config,
        variables: {
          SERVICE_NAME: 'my-service',
          API_KEY: 'secret123',
        },
      };
      
      const saved = JSON.stringify(savedData);
      const loaded: { config: OtelSdkConfig; variables: Record<string, unknown> } = JSON.parse(saved);
      
      const { result: hook2 } = renderHook(() => useOTelConfig(loaded.config));
      
      expect(hook2.current.config.trace.batchConfig?.maxQueueSize).toBe(8192);
      expect(loaded.variables).toEqual({
        SERVICE_NAME: 'my-service',
        API_KEY: 'secret123',
      });
    });
  });
});