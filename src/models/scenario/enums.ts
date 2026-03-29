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

export enum FailureType {
  DATABASE_TIMEOUT = 'database_timeout',
  HIGH_LATENCY = 'high_latency',
  CASCADING_FAILURE = 'cascading_failure',
  CIRCUIT_BREAKER = 'circuit_breaker',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
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

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export enum GrpcMethodType {
  UNARY = 'unary',
  SERVER_STREAMING = 'server_streaming',
  CLIENT_STREAMING = 'client_streaming',
  BIDIRECTIONAL = 'bidirectional',
}

export enum MetricSource {
  CPU = 'cpu',
  MEMORY = 'memory',
  DISK = 'disk',
  NETWORK = 'network',
  PROCESS = 'process',
  CUSTOM = 'custom',
}