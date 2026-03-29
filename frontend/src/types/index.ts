export enum TelemetryType {
  TRACES = 'traces',
  METRICS = 'metrics',
  LOGS = 'logs',
  UNIFIED = 'unified',
}

export enum StatusCode {
  OK = 'OK',
  ERROR = 'ERROR',
  UNSET = 'UNSET',
}

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  EXPONENTIAL_HISTOGRAM = 'exponential_histogram',
  SUM = 'sum',
}

export enum DistributionType {
  UNIFORM = 'uniform',
  GAUSSIAN = 'gaussian',
  LINEAR_RAMP = 'linearRamp',
  EXPONENTIAL_RAMP = 'exponentialRamp',
  SINE = 'sine',
  SQUARE = 'square',
  TRIANGLE = 'triangle',
  BURST = 'burst',
  POISSON = 'poisson',
  EXPONENTIAL = 'exponential',
  FIXED = 'fixed',
}

export enum RunStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  RUNNING = 'running',
}

export enum RunMode {
  REALTIME = 'realtime',
  HISTORICAL = 'historical',
}

export enum SpanKind {
  SERVER = 'server',
  CLIENT = 'client',
  PRODUCER = 'producer',
  CONSUMER = 'consumer',
  INTERNAL = 'internal',
}

export interface SpanEvent {
  name: string;
  timestampOffsetMs: number;
  attributes: Record<string, string | number | boolean>;
}

export interface SpanLink {
  traceId: string;
  spanId: string;
  attributes: Record<string, string | number | boolean>;
}

export interface SpanConfig {
  id?: string;
  parentSpanId?: string;
  name: string;
  kind: SpanKind;
  statusCode: StatusCode;
  attributes: Record<string, string | number | boolean>;
  events: SpanEvent[];
  links: SpanLink[];
  durationMs: number;
}

export interface TraceScenarioConfig {
  spans: SpanConfig[];
  samplingRatio: number;
}

export interface MetricScenarioConfig {
  metrics: MetricPoint[];
  metricAttributes: Record<string, string>;
  temporality: MetricTemporality;
  aggregation: AggregationType;
  readers: MetricReaderType[];
}

export interface LogScenarioConfig {
  logs: LogRecord[];
  logAttributes: Record<string, string>;
  includeTraceId: boolean;
  includeSpanId: boolean;
  includeResourceAttributes: boolean;
  includeLogLevel: boolean;
  includeSystemAttributes: boolean;
}

export interface MetricPoint {
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  labels: Record<string, string>;
  histogramBuckets?: number[];
}

export interface LogRecord {
  severityNumber: number;
  severityText: string;
  body: string;
  attributes: Record<string, string | number | boolean>;
}

export interface UnifiedScenarioParams {
  includeTraces: boolean;
  includeMetrics: boolean;
  includeLogs: boolean;
  rootSpan: SpanConfig;
  traceAttributes: Record<string, string | number | boolean>;
  metrics: MetricPoint[];
  logs: LogRecord[];
  correlationEnabled: boolean;
}

export interface TraceScenarioParams {
  traceConfig: TraceScenarioConfig;
}

export interface MetricScenarioParams {
  metricConfig: MetricScenarioConfig;
}

export interface LogScenarioParams {
  logConfig: LogScenarioConfig;
}

export interface ScheduleConfig {
  enabled: boolean;
  cronExpression?: string;
  intervalMs?: number;
}

export interface RunLimits {
  maxConcurrent: number;
  maxPerHour: number;
}

export type VariableValue = string | number | boolean | string[] | number[] | Record<string, unknown>;

export interface GlobalVariables {
  [key: string]: VariableValue;
}

export interface ScenarioVariables {
  [key: string]: VariableValue;
}

export interface UniformConfig {
  type: 'uniform';
  min: number;
  max: number;
}

export interface GaussianConfig {
  type: 'gaussian';
  mean: number;
  stdDev: number;
}

export interface LinearRampConfig {
  type: 'linearRamp';
  start: number;
  end: number;
  duration: number;
}

export interface ExponentialRampConfig {
  type: 'exponentialRamp';
  start: number;
  growth: number;
  duration: number;
  max?: number;
}

export interface SineWaveConfig {
  type: 'sine';
  base: number;
  amplitude: number;
  period: number;
  phase?: number;
}

export interface SquareWaveConfig {
  type: 'square';
  min: number;
  max: number;
  period: number;
}

export interface TriangleWaveConfig {
  type: 'triangle';
  min: number;
  max: number;
  period: number;
}

export interface BurstConfig {
  type: 'burst';
  baseRate: number;
  burstRate: number;
  probability?: number;
}

export interface PoissonConfig {
  type: 'poisson';
  lambda: number;
}

export interface ExponentialConfig {
  type: 'exponential';
  lambda: number;
}

export interface FixedConfig {
  type: 'fixed';
  rate: number;
}

export type DistributionConfig = 
  | UniformConfig 
  | GaussianConfig 
  | LinearRampConfig 
  | ExponentialRampConfig 
  | SineWaveConfig 
  | SquareWaveConfig 
  | TriangleWaveConfig 
  | BurstConfig 
  | PoissonConfig 
  | ExponentialConfig 
  | FixedConfig;

export interface RunHistoryEntry {
  timestamp: string;
  status: RunStatus;
  mode: RunMode;
  recordsGenerated: number;
  tracesGenerated: number;
  metricsGenerated: number;
  logsGenerated: number;
  error?: string;
}

export interface RunProgress {
  startedAt: string;
  mode: RunMode;
  rate: number;
  duration?: number;
  tracesGenerated: number;
  metricsGenerated: number;
  logsGenerated: number;
  totalRecords: number;
  totalExpected?: number;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

export enum OtelProtocol {
  GRPC = 'grpc',
  HTTP = 'http',
  HTTP_JSON = 'http/json',
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export enum MetricTemporality {
  CUMULATIVE = 'cumulative',
  DELTA = 'delta',
}

export enum AggregationType {
  DROP = 'drop',
  LAST_VALUE = 'last_value',
  SUM = 'sum',
  HISTOGRAM = 'histogram',
  EXPONENTIAL_HISTOGRAM = 'exponential_histogram',
}

export enum SamplerType {
  ALWAYS_ON = 'always_on',
  ALWAYS_OFF = 'always_off',
  PARENT_BASED_ALWAYS_ON = 'parentbased_always_on',
  PARENT_BASED_ALWAYS_OFF = 'parentbased_always_off',
  PARENT_BASED_TRACE_ID = 'parentbased_traceidratio',
  TRACE_ID_RATIO = 'traceidratio',
}

export enum ExporterType {
  OTLP = 'otlp',
  JAEGER = 'jaeger',
  ZIPKIN = 'zipkin',
  PROMETHEUS = 'prometheus',
  CONSOLE = 'console',
}

export enum SpanProcessorType {
  BATCH = 'batch',
  SIMPLE = 'simple',
}

export enum PropagatorType {
  W3C = 'w3c',
  B3 = 'b3',
  B3_SINGLE = 'b3_single',
  JAEGER = 'jaeger',
  XRAY = 'xray',
  OT_TRACE = 'ottrace',
}

export enum CompressionType {
  NONE = 'none',
  GZIP = 'gzip',
  ZSTD = 'zstd',
}

export enum MetricReaderType {
  PERIODIC = 'periodic',
  PULL = 'pull',
}

export interface TlsConfig {
  insecure: boolean;
  caFile?: string;
  certFile?: string;
  keyFile?: string;
}

export interface ExporterConfig {
  type: ExporterType;
  endpoint: string;
  protocol: OtelProtocol;
  timeout: number;
  compression: CompressionType;
  headers?: Record<string, string>;
  tlsConfig?: TlsConfig;
}

export interface SpanLimitsConfig {
  maxNumberOfAttributes: number;
  maxNumberOfAttributesPerSpan: number;
  maxNumberOfEvents: number;
  maxNumberOfLinks: number;
  maxNumberOfAttributesPerEvent: number;
  maxNumberOfAttributesPerLink: number;
  maxAttributeValueLength: number;
}

export interface MetricLimitsConfig {
  maxNumberOfMetrics: number;
  maxNumberOfDataPointsPerMetric: number;
  maxNumberOfDataPointValuesPerMetric: number;
}

export interface ViewConfig {
  name: string;
  description?: string;
  unit?: string;
  attributeKeys?: string[];
  aggregation?: AggregationType;
  histogramBucketBoundaries?: number[];
}

export interface OtelTraceConfig {
  enabled: boolean;
  serviceName: string;
  instrumentationScopeName: string;
  instrumentationScopeVersion: string;
  protocol: OtelProtocol;
  endpoint: string;
  timeout: number;
  compression: CompressionType;
  resourceAttributes: Record<string, string>;
  samplerType: SamplerType;
  samplerParam: number;
  spanLimits: SpanLimitsConfig;
  spanProcessor: SpanProcessorType;
  batchConfig?: {
    maxQueueSize: number;
    maxExportBatchSize: number;
    exportTimeout: number;
    scheduledDelay: number;
  };
  simpleConfig?: {
    exportTimeout: number;
  };
  exporters: ExporterConfig[];
}

export interface OtelMetricConfig {
  enabled: boolean;
  serviceName: string;
  instrumentationScopeName: string;
  instrumentationScopeVersion: string;
  protocol: OtelProtocol;
  endpoint: string;
  timeout: number;
  compression: CompressionType;
  resourceAttributes: Record<string, string>;
  metricAttributes: Record<string, string>;
  temporality: MetricTemporality;
  aggregation: AggregationType;
  metricLimits: MetricLimitsConfig;
  views: ViewConfig[];
  readers: MetricReaderType[];
  exporters: ExporterConfig[];
}

export interface OtelLogConfig {
  enabled: boolean;
  serviceName: string;
  instrumentationScopeName: string;
  instrumentationScopeVersion: string;
  protocol: OtelProtocol;
  endpoint: string;
  timeout: number;
  compression: CompressionType;
  includeTraceId: boolean;
  includeSpanId: boolean;
  includeResourceAttributes: boolean;
  includeLogLevel: boolean;
  includeSystemAttributes: boolean;
  resourceAttributes: Record<string, string>;
  logAttributes: Record<string, string>;
  maxNumberOfAttributes: number;
  maxNumberOfAttributesPerLogRecord: number;
  maxNumberOfLogRecords: number;
  exporters: ExporterConfig[];
}

export interface OtelResourceConfig {
  serviceName: string;
  serviceNamespace?: string;
  serviceInstanceId?: string;
  serviceVersion?: string;
  deploymentEnvironment?: string;
  attributes: Record<string, string>;
}

export interface OtelPropagatorConfig {
  propagators: PropagatorType[];
  baggageKeys?: string[];
}

export interface OtelSdkConfig {
  sdkName: string;
  sdkVersion: string;
  logLevel: LogLevel;
  resource: OtelResourceConfig;
  propagators: OtelPropagatorConfig;
  trace: OtelTraceConfig;
  metric: OtelMetricConfig;
  log: OtelLogConfig;
}

export interface Project {
  _id: string;
  teamId: string;
  name: string;
  description: string;
  otelCollectorEndpoint: string;
  projectVariables?: Record<string, string | number | boolean | string[] | number[]>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  _id: string;
  projectId: string;
  name: string;
  description: string;
  otelSdkConfig: OtelSdkConfig;
  serviceVariables?: Record<string, string | number | boolean | string[] | number[]>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  project?: Project;
}

export interface SyntheticScenario {
  _id: string;
  teamId: string;
  projectId: string;
  serviceId: string;
  name: string;
  description: string;
  telemetryType: TelemetryType;
  params: UnifiedScenarioParams | TraceScenarioParams | MetricScenarioParams | LogScenarioParams;
  attributes: Record<string, string>;
  distribution: DistributionConfig;
  variables?: ScenarioVariables;
  schedule?: ScheduleConfig;
  limits?: RunLimits;
  isActive: boolean;
  lastRunAt?: string;
  lastRunStatus?: RunStatus;
  recentRuns: RunHistoryEntry[];
  currentRunProgress?: RunProgress;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  projectVariables?: Record<string, string | number | boolean | string[] | number[]>;
  service?: Service;
  serviceVariables?: Record<string, string | number | boolean | string[] | number[]>;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  otelCollectorEndpoint?: string;
  projectVariables?: Record<string, string | number | boolean | string[] | number[] | Record<string, any>>;
}

export interface CreateServiceInput {
  projectId: string;
  name: string;
  description?: string;
  otelSdkConfig?: Partial<OtelSdkConfig>;
  serviceVariables?: Record<string, string | number | boolean | string[] | number[] | Record<string, any>>;
}

export interface CreateScenarioInput {
  projectId: string;
  serviceId: string;
  name: string;
  description?: string;
  telemetryType: TelemetryType;
  params?: UnifiedScenarioParams | TraceScenarioParams | MetricScenarioParams | LogScenarioParams;
  attributes?: Record<string, string>;
  distribution?: DistributionConfig;
  variables?: ScenarioVariables;
  schedule?: ScheduleConfig;
  limits?: RunLimits;
  isActive?: boolean;
}

export interface RunScenarioInput {
  mode?: 'realtime' | 'historical';
  duration?: number;
  timeRange?: {
    start: string;
    end: string;
  };
}

export interface RunResult {
  success: boolean;
  recordsGenerated: number;
  tracesGenerated: number;
  metricsGenerated: number;
  logsGenerated: number;
  error?: string;
}

export interface ImportResult {
  imported: number;
  scenarios: SyntheticScenario[];
}