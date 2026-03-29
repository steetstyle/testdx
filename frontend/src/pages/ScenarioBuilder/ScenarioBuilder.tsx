import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Stack, Grid, Tabs, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { syntheticApi, scenarioApi } from '../../services/api';
import { SpanTreeEditor } from '../../components/SpanTreeEditor';
import { SpanConfigCard } from '../../components/SpanConfigCard';
import { MetricsEditor } from '../../components/MetricsEditor';
import { LogsEditor } from '../../components/LogsEditor';
import { VariablesEditor } from '../../components/VariablesEditor';
import { OTelConfigForm } from '../../components/OTelConfigForm';
import { ConfigExportDialog } from '../../components/ConfigExportDialog';
import {
  ScenarioHeader,
  ScenarioDetailsCard,
  TelemetryTypeSelector,
  DistributionConfig,
  ScheduleConfig,
  RunSummaryPanel,
} from './components';
import {
  useScenarioForm,
  useLoadScenario,
  useScenarioSave,
  defaultDistribution,
  defaultTraceConfig,
  defaultMetricConfig,
  defaultLogConfig,
} from './hooks';
import { useProgressPolling } from '../../hooks';
import type { RunProgress, TelemetryType } from '../../types';
import type { GlobalVariables, ScenarioVariables } from '../../services/variables/types';
import type { OtelSdkConfig } from '../../types';
import {
  LogLevel,
  OtelProtocol,
  CompressionType,
  SamplerType,
  SpanProcessorType,
  MetricTemporality,
  AggregationType,
  MetricReaderType,
  SpanLimitsConfig,
  MetricLimitsConfig,
} from '../../types';

export function ScenarioBuilder() {
  const { projectId, serviceId, id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id) && id !== 'new';

  const { formData, updateFormData, updateDistribution, updateMetricConfig, updateLogConfig, updateSpans, addSpan, updateSpan, deleteSpan, setFormData } = useScenarioForm();
  const { loadScenario, loadService, projectVariables, serviceVariables, serviceConfig } = useLoadScenario();
  const progressPolling = useProgressPolling();
  const [exportOpened, { open: openExport, close: closeExport }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [progress, setProgress] = useState<RunProgress | null>(null);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);

  const checkExistingProgress = useCallback(async (scenarioId: string) => {
    try {
      const existingProgress = await scenarioApi.getProgress(scenarioId);
      if (existingProgress && existingProgress.status === 'running') {
        setProgress(existingProgress);
        progressPolling.startPolling(scenarioId);
      }
    } catch (err) {
      console.error('Failed to check existing progress:', err);
    }
  }, [progressPolling]);

  const { save, run } = useScenarioSave({
    projectId: projectId || '',
    serviceId: serviceId || '',
    isEditing,
    scenarioId: id,
    formData,
  });

  useEffect(() => {
    if (id && id !== 'new') {
      loadScenario(id).then(setFormData).catch(console.error);
      checkExistingProgress(id);
    }
    if (serviceId) {
      loadService(serviceId).catch(console.error);
    }
  }, [id, serviceId]);

  useEffect(() => {
    if (progressPolling.progress) {
      setProgress(progressPolling.progress);
    }
  }, [progressPolling.progress]);

  const handleSave = async () => {
    if (!projectId || !serviceId) return;
    setLoading(true);
    try {
      await save();
      console.log('Save completed, navigating...');
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save: ' + (err instanceof Error ? err.message : err));
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    if (!projectId || !serviceId) return;
    setLoading(true);
    try {
      const scenarioId = await run();
      console.log('Run started, scenarioId:', scenarioId);
      progressPolling.startPolling(scenarioId);
    } catch (err) {
      console.error('Failed to run:', err);
      alert('Failed to run: ' + (err instanceof Error ? err.message : err));
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!id || id === 'new') return;
    setStopping(true);
    try {
      await scenarioApi.stopScenario(id);
      progressPolling.stopPolling();
    } catch (err) {
      console.error('Failed to stop:', err);
    } finally {
      setStopping(false);
    }
  };

  const selectedSpan = formData.traceConfig.spans.find(s => s.id === selectedSpanId) || null;
  const spanNames = formData.traceConfig.spans.map(s => s.id || s.name);

  const handleUpdateFormData = (updates: Partial<typeof formData>) => {
    updateFormData(updates);
  };

  const defaultOtelConfig: OtelSdkConfig = {
    sdkName: 'opentelemetry-js',
    sdkVersion: '1.0.0',
    logLevel: LogLevel.INFO,
    resource: { serviceName: formData.name || 'synthetic-service', attributes: {} },
    propagators: { propagators: [] },
    trace: {
      enabled: true,
      serviceName: formData.name,
      instrumentationScopeName: '',
      instrumentationScopeVersion: '',
      protocol: OtelProtocol.HTTP,
      endpoint: '',
      timeout: 30000,
      compression: CompressionType.GZIP,
      resourceAttributes: {},
      samplerType: SamplerType.PARENT_BASED_TRACE_ID,
      samplerParam: 1.0,
      spanLimits: {
        maxNumberOfAttributes: 1000,
        maxNumberOfAttributesPerSpan: 128,
        maxNumberOfEvents: 100,
        maxNumberOfLinks: 100,
        maxNumberOfAttributesPerEvent: 32,
        maxNumberOfAttributesPerLink: 32,
        maxAttributeValueLength: 4096,
      } as SpanLimitsConfig,
      spanProcessor: SpanProcessorType.BATCH,
      exporters: [],
    },
    metric: {
      enabled: true,
      serviceName: formData.name,
      instrumentationScopeName: '',
      instrumentationScopeVersion: '',
      protocol: OtelProtocol.HTTP,
      endpoint: '',
      timeout: 30000,
      compression: CompressionType.GZIP,
      resourceAttributes: {},
      metricAttributes: {},
      temporality: MetricTemporality.CUMULATIVE,
      aggregation: AggregationType.HISTOGRAM,
      metricLimits: {
        maxNumberOfMetrics: 1000,
        maxNumberOfDataPointsPerMetric: 1000,
        maxNumberOfDataPointValuesPerMetric: 1000,
      } as MetricLimitsConfig,
      views: [],
      readers: [MetricReaderType.PERIODIC],
      exporters: [],
    },
    log: {
      enabled: true,
      serviceName: formData.name,
      instrumentationScopeName: '',
      instrumentationScopeVersion: '',
      protocol: OtelProtocol.HTTP,
      endpoint: '',
      timeout: 30000,
      compression: CompressionType.GZIP,
      includeTraceId: true,
      includeSpanId: true,
      includeResourceAttributes: true,
      includeLogLevel: true,
      includeSystemAttributes: false,
      resourceAttributes: {},
      logAttributes: {},
      maxNumberOfAttributes: 100,
      maxNumberOfAttributesPerLogRecord: 32,
      maxNumberOfLogRecords: 1000,
      exporters: [],
    },
  };

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-body)' }}>
      <ScenarioHeader
        isEditing={isEditing}
        onSave={handleSave}
        onRun={handleRun}
        onExport={openExport}
        saving={loading}
      />

      <ConfigExportDialog
        opened={exportOpened}
        onClose={closeExport}
        config={serviceConfig || defaultOtelConfig}
        title="Export Scenario Configuration"
        mode="scenario"
        scenarioName={formData.name}
        telemetryType={formData.telemetryType}
        traceConfig={formData.traceConfig}
        metricConfig={formData.metricConfig}
        logConfig={formData.logConfig}
      />

      <Grid p="md" maw={1400} mx="auto" gutter="md">
        <Grid.Col span={8}>
          <Stack gap="md">
            <ScenarioDetailsCard
              name={formData.name}
              description={formData.description}
              onChange={handleUpdateFormData}
            />

            <TelemetryTypeSelector
              telemetryType={formData.telemetryType}
              includeTraces={formData.includeTraces}
              includeMetrics={formData.includeMetrics}
              includeLogs={formData.includeLogs}
              correlationEnabled={formData.correlationEnabled}
              onChange={handleUpdateFormData}
            />

            <Tabs defaultValue="config">
              <Tabs.List>
                <Tabs.Tab value="config">Distribution</Tabs.Tab>
                <Tabs.Tab
                  value="trace"
                  disabled={
                    !formData.includeTraces &&
                    formData.telemetryType !== 'traces' &&
                    formData.telemetryType !== 'unified'
                  }
                >
                  Traces
                </Tabs.Tab>
                <Tabs.Tab
                  value="metric"
                  disabled={
                    !formData.includeMetrics &&
                    formData.telemetryType !== 'metrics' &&
                    formData.telemetryType !== 'unified'
                  }
                >
                  Metrics
                </Tabs.Tab>
                <Tabs.Tab
                  value="log"
                  disabled={
                    !formData.includeLogs &&
                    formData.telemetryType !== 'logs' &&
                    formData.telemetryType !== 'unified'
                  }
                >
                  Logs
                </Tabs.Tab>
                <Tabs.Tab value="schedule">Schedule</Tabs.Tab>
                <Tabs.Tab value="variables">Variables</Tabs.Tab>
                <Tabs.Tab value="sdk">SDK Config</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="config" pt="md">
                <DistributionConfig
                  distribution={formData.distribution}
                  onChange={updateDistribution}
                />
              </Tabs.Panel>

              <Tabs.Panel value="trace" pt="md">
                <Grid gutter="md">
                  <Grid.Col span={5}>
                    <SpanTreeEditor
                      spans={formData.traceConfig.spans}
                      selectedSpanId={selectedSpanId}
                      onSelectSpan={setSelectedSpanId}
                      onAddChild={addSpan}
                      onAddSibling={(siblingId) => addSpan(siblingId)}
                      onDeleteSpan={deleteSpan}
                      onUpdateSpan={updateSpan}
                    />
                  </Grid.Col>
                  <Grid.Col span={7}>
                    <SpanConfigCard
                      span={selectedSpan}
                      allSpanNames={spanNames}
                      onUpdate={(updates) => {
                        if (selectedSpanId) {
                          updateSpan(selectedSpanId, updates);
                        }
                      }}
                    />
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

              <Tabs.Panel value="metric" pt="md">
                <MetricsEditor
                  metrics={formData.metricConfig.metrics}
                  temporality={formData.metricConfig.temporality}
                  aggregation={formData.metricConfig.aggregation}
                  readers={formData.metricConfig.readers}
                  metricAttributes={formData.metricConfig.metricAttributes}
                  onUpdateMetrics={(metrics) => updateMetricConfig({ metrics })}
                  onUpdateTemporality={(temporality) => updateMetricConfig({ temporality })}
                  onUpdateAggregation={(aggregation) => updateMetricConfig({ aggregation })}
                  onUpdateReaders={(readers) => updateMetricConfig({ readers })}
                  onUpdateMetricAttributes={(metricAttributes) => updateMetricConfig({ metricAttributes })}
                />
              </Tabs.Panel>

              <Tabs.Panel value="log" pt="md">
                <LogsEditor
                  logs={formData.logConfig.logs}
                  logAttributes={formData.logConfig.logAttributes}
                  includeTraceId={formData.logConfig.includeTraceId}
                  includeSpanId={formData.logConfig.includeSpanId}
                  includeResourceAttributes={formData.logConfig.includeResourceAttributes}
                  includeLogLevel={formData.logConfig.includeLogLevel}
                  includeSystemAttributes={formData.logConfig.includeSystemAttributes}
                  onUpdateLogs={(logs) => updateLogConfig({ logs })}
                  onUpdateLogAttributes={(logAttributes) => updateLogConfig({ logAttributes })}
                  onUpdateIncludeTraceId={(includeTraceId) => updateLogConfig({ includeTraceId })}
                  onUpdateIncludeSpanId={(includeSpanId) => updateLogConfig({ includeSpanId })}
                  onUpdateIncludeResourceAttributes={(includeResourceAttributes) => updateLogConfig({ includeResourceAttributes })}
                  onUpdateIncludeLogLevel={(includeLogLevel) => updateLogConfig({ includeLogLevel })}
                  onUpdateIncludeSystemAttributes={(includeSystemAttributes) => updateLogConfig({ includeSystemAttributes })}
                />
              </Tabs.Panel>

              <Tabs.Panel value="schedule" pt="md">
                <ScheduleConfig
                  schedule={formData.schedule}
                  onChange={(updates) => updateFormData({ schedule: { ...formData.schedule, ...updates } })}
                />
              </Tabs.Panel>

              <Tabs.Panel value="variables" pt="md">
                <VariablesEditor
                  scenarioVariables={formData.variables as GlobalVariables}
                  projectVariables={projectVariables}
                  serviceVariables={serviceVariables}
                  inheritedProjectVariables={{}}
                  inheritedServiceVariables={{}}
                  onScenarioVariablesChange={(vars) => updateFormData({ variables: vars as ScenarioVariables })}
                  showInheritance={true}
                />
              </Tabs.Panel>

              <Tabs.Panel value="sdk" pt="md">
                <Box style={{ backgroundColor: 'var(--color-bg-surface)', borderRadius: 8, padding: 16 }}>
                  <Text size="xs" c="dimmed" ta="center">SDK Configuration is inherited from Service level. Edit from Dashboard &gt; Services</Text>
                </Box>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Grid.Col>

        <Grid.Col span={4}>
          <RunSummaryPanel
            formData={formData}
            progress={progress}
            onRun={handleRun}
            onStop={handleStop}
            onUpdateFormData={handleUpdateFormData}
            loading={loading}
            stopping={stopping}
          />
        </Grid.Col>
      </Grid>
    </Box>
  );
}

export default ScenarioBuilder;
