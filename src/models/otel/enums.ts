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