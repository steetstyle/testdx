import { useState, useMemo, useCallback } from 'react';
import type { OtelSdkConfig } from '../../types';
import {
  generateYamlConfig,
  generateEnvVars,
  formatEnvVars,
  generateCodeSnippet,
  generateScenarioYaml,
  CodeLanguage
} from '../../services/configGenerator';

interface UseExportDialogReturn {
  yamlContent: string;
  envContent: string;
  codeContent: string;
  handleDownload: (content: string, filename: string) => void;
  language: CodeLanguage;
  setLanguage: (language: CodeLanguage) => void;
}

export function useExportDialog(
  config: OtelSdkConfig,
  mode: 'sdk' | 'scenario',
  scenarioName?: string,
  telemetryType?: string,
  traceConfig?: unknown,
  metricConfig?: unknown,
  logConfig?: unknown
): UseExportDialogReturn {
  const [language, setLanguage] = useState<CodeLanguage>('node');

  const yamlContent = useMemo(() => {
    if (mode === 'scenario' && scenarioName) {
      return generateScenarioYaml(
        scenarioName,
        telemetryType || 'unified',
        traceConfig || {},
        metricConfig || {},
        logConfig || {}
      );
    }
    return generateYamlConfig(config);
  }, [config, mode, scenarioName, telemetryType, traceConfig, metricConfig, logConfig]);

  const envContent = useMemo(() => {
    const envVars = generateEnvVars(config);
    return formatEnvVars(envVars);
  }, [config]);

  const codeContent = useMemo(() => {
    return generateCodeSnippet(config, language);
  }, [config, language]);

  const handleDownload = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    yamlContent,
    envContent,
    codeContent,
    handleDownload,
    language,
    setLanguage,
  };
}