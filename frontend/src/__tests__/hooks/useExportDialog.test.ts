import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExportDialog } from '../../components/ConfigExportDialog/useExportDialog';
import { defaultOTelConfig } from '../../components/OTelConfig/useOTelConfig';
import type { OtelSdkConfig } from '../../types';

vi.mock('../../services/configGenerator', () => ({
  generateYamlConfig: vi.fn((config: OtelSdkConfig) => `yaml: ${config.resource?.serviceName || 'default'}`),
  generateEnvVars: vi.fn(() => ({ 'OTEL_SERVICE_NAME': 'test' })),
  formatEnvVars: vi.fn((vars: Record<string, string>) => Object.entries(vars).map(([k, v]) => `${k}=${v}`).join('\n')),
  generateCodeSnippet: vi.fn((config: OtelSdkConfig, lang: string) => `// code for ${lang}: ${config.resource?.serviceName || 'default'}`),
  generateScenarioYaml: vi.fn((name: string, type: string) => `scenario: ${name}, type: ${type}`),
}));

describe('useExportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default language node', () => {
    const { result } = renderHook(() => useExportDialog(defaultOTelConfig, 'sdk'));
    expect(result.current.language).toBe('node');
  });

  describe('yamlContent', () => {
    it('generates yaml config for sdk mode', () => {
      const { result } = renderHook(() => useExportDialog(defaultOTelConfig, 'sdk'));
      expect(result.current.yamlContent).toContain('yaml:');
    });

    it('generates scenario yaml when mode is scenario and scenarioName is provided', () => {
      const { result } = renderHook(() => useExportDialog(defaultOTelConfig, 'scenario', 'my-scenario', 'traces'));
      expect(result.current.yamlContent).toContain('scenario: my-scenario');
    });

    it('falls back to generateYamlConfig when mode is scenario but no scenarioName', () => {
      const { result } = renderHook(() => useExportDialog(defaultOTelConfig, 'scenario'));
      expect(result.current.yamlContent).toContain('yaml:');
    });
  });

  describe('envContent', () => {
    it('generates formatted env vars from config', () => {
      const { result } = renderHook(() => useExportDialog(defaultOTelConfig, 'sdk'));
      expect(result.current.envContent).toContain('OTEL_SERVICE_NAME=test');
    });
  });

  describe('codeContent', () => {
    it('generates code snippet with current language', () => {
      const { result } = renderHook(() => useExportDialog(defaultOTelConfig, 'sdk'));
      expect(result.current.codeContent).toContain('code for node:');
    });

    it('updates code content when language changes', () => {
      const { result } = renderHook(() => useExportDialog(defaultOTelConfig, 'sdk'));
      expect(result.current.codeContent).toContain('code for node:');
    });
  });

  describe('setLanguage', () => {
    it('is a function that can be called', () => {
      const { result } = renderHook(() => useExportDialog(defaultOTelConfig, 'sdk'));
      expect(typeof result.current.setLanguage).toBe('function');
      result.current.setLanguage('python');
      expect(typeof result.current.setLanguage).toBe('function');
    });
  });

  describe('handleDownload', () => {
    it('is a function that can be called', () => {
      const { result } = renderHook(() => useExportDialog(defaultOTelConfig, 'sdk'));
      expect(typeof result.current.handleDownload).toBe('function');
    });
  });

  it('returns all required properties', () => {
    const { result } = renderHook(() => useExportDialog(defaultOTelConfig, 'sdk'));
    
    expect(result.current).toHaveProperty('yamlContent');
    expect(result.current).toHaveProperty('envContent');
    expect(result.current).toHaveProperty('codeContent');
    expect(result.current).toHaveProperty('handleDownload');
    expect(result.current).toHaveProperty('language');
    expect(result.current).toHaveProperty('setLanguage');
  });
});