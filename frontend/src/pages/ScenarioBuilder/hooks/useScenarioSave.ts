import { useCallback } from 'react';
import { syntheticApi } from '../../../services/api';
import { RunMode } from '../../../types';
import type { ScenarioFormData } from './useScenarioForm';

export interface UseScenarioSaveOptions {
  projectId: string;
  serviceId: string;
  isEditing: boolean;
  scenarioId?: string;
  formData: ScenarioFormData;
}

export interface UseScenarioSaveReturn {
  save: (activate?: boolean) => Promise<void>;
  run: () => Promise<string>;
  buildParams: () => {
    includeTraces: boolean;
    includeMetrics: boolean;
    includeLogs: boolean;
    correlationEnabled: boolean;
    rootSpan: Record<string, unknown>;
    traceAttributes: Record<string, unknown>;
    metrics: unknown[];
    logs: unknown[];
  };
}

export function useScenarioSave({
  projectId,
  serviceId,
  isEditing,
  scenarioId,
  formData,
}: UseScenarioSaveOptions): UseScenarioSaveReturn {
  const buildParams = useCallback(() => {
    const firstSpan = formData.traceConfig.spans?.[0] || {
      name: 'root-operation',
      kind: 'server',
      statusCode: 'Ok',
      attributes: {},
      events: [],
      links: [],
      childSpans: 2,
      durationMs: 100,
    };

    return {
      includeTraces: formData.includeTraces,
      includeMetrics: formData.includeMetrics,
      includeLogs: formData.includeLogs,
      correlationEnabled: formData.correlationEnabled,
      rootSpan: {
        ...firstSpan,
        kind: firstSpan.kind || 'server',
        statusCode: firstSpan.statusCode || 'Ok',
        attributes: firstSpan.attributes || {},
        events: firstSpan.events || [],
        links: firstSpan.links || [],
        childSpans: formData.traceConfig.spans?.length ? formData.traceConfig.spans.length - 1 : 2,
        durationMs: firstSpan.durationMs || 100,
      },
      traceAttributes: firstSpan.attributes || {},
      metrics: formData.metricConfig.metrics || [],
      logs: formData.logConfig.logs || [],
    };
  }, [formData]);

  const save = useCallback(async (activate = false): Promise<void> => {
    const params = buildParams();

    const scenarioData = {
      projectId,
      serviceId,
      name: formData.name,
      description: formData.description,
      telemetryType: formData.telemetryType,
      params,
      distribution: formData.distribution,
      schedule: formData.schedule,
      variables: formData.variables,
      isActive: activate,
    };

    if (isEditing && scenarioId) {
      await syntheticApi.updateScenario(scenarioId, scenarioData);
    } else {
      await syntheticApi.createScenario(scenarioData);
    }
  }, [projectId, serviceId, isEditing, scenarioId, formData, buildParams]);

  const run = useCallback(async (): Promise<string> => {
    let currentScenarioId = scenarioId;

    if (!isEditing) {
      const params = buildParams();
      const created = await syntheticApi.createScenario({
        projectId,
        serviceId,
        name: formData.name || 'Untitled',
        description: formData.description,
        telemetryType: formData.telemetryType,
        params,
        distribution: formData.distribution,
        schedule: formData.schedule,
      });
      currentScenarioId = created._id;
    }

    const runInput = formData.runMode === RunMode.HISTORICAL && formData.timeRange
      ? { mode: RunMode.HISTORICAL, timeRange: formData.timeRange }
      : { mode: RunMode.REALTIME, duration: formData.duration };

    await syntheticApi.runScenario(currentScenarioId!, runInput);
    return currentScenarioId!;
  }, [projectId, serviceId, isEditing, scenarioId, formData, buildParams]);

  return {
    save,
    run,
    buildParams,
  };
}
