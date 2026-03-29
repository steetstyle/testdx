import {
  OtelSdkConfig,
  SamplerType,
  CompressionType,
  OtelProtocol,
} from '../types';

export type CodeLanguage = 'node' | 'go' | 'python' | 'java';

function mapProtocol(protocol: OtelProtocol): string {
  switch (protocol) {
    case OtelProtocol.GRPC: return 'grpc';
    case OtelProtocol.HTTP: return 'http/protobuf';
    case OtelProtocol.HTTP_JSON: return 'http/json';
    default: return 'http/protobuf';
  }
}

function mapCompression(compression: CompressionType): string {
  switch (compression) {
    case CompressionType.GZIP: return 'gzip';
    case CompressionType.ZSTD: return 'zstd';
    default: return 'none';
  }
}

function mapSampler(samplerType: SamplerType): string {
  switch (samplerType) {
    case SamplerType.ALWAYS_ON: return 'always_on';
    case SamplerType.ALWAYS_OFF: return 'always_off';
    case SamplerType.PARENT_BASED_ALWAYS_ON: return 'parentbased_always_on';
    case SamplerType.PARENT_BASED_ALWAYS_OFF: return 'parentbased_always_off';
    case SamplerType.PARENT_BASED_TRACE_ID: return 'parentbased_traceidratio';
    case SamplerType.TRACE_ID_RATIO: return 'traceidratio';
    default: return 'parentbased_traceidratio';
  }
}

function indent(text: string, spaces: number): string {
  return ' '.repeat(spaces) + text;
}

export function generateYamlConfig(config: OtelSdkConfig): string {
  const lines: string[] = [];

  lines.push('# OpenTelemetry Collector Configuration');
  lines.push('# Generated from SDK Config');
  lines.push('');
  lines.push('receivers:');
  lines.push('  otlp:');
  lines.push('    protocols:');
  lines.push('      grpc:');
  lines.push('        endpoint: 0.0.0.0:4317');
  lines.push('      http:');
  lines.push('        endpoint: 0.0.0.0:4318');
  lines.push('');

  lines.push('processors:');
  lines.push('  batch:');
  lines.push('    timeout: 1s');
  lines.push('    send_batch_size: 1024');
  lines.push('');

  lines.push('exporters:');
  if (config.trace.enabled && config.trace.exporters?.length > 0) {
    config.trace.exporters.forEach((exporter, idx) => {
      lines.push(`  otlptrace_${idx}:`);
      lines.push(`    endpoint: ${exporter.endpoint}`);
      lines.push(`    protocol: ${mapProtocol(exporter.protocol)}`);
      lines.push(`    tls:`);
      lines.push(`      insecure: ${exporter.tlsConfig?.insecure ?? true}`);
      if (exporter.tlsConfig?.caFile) {
        lines.push(`      ca_file: ${exporter.tlsConfig.caFile}`);
      }
      if (exporter.tlsConfig?.certFile) {
        lines.push(`      cert_file: ${exporter.tlsConfig.certFile}`);
      }
      if (exporter.tlsConfig?.keyFile) {
        lines.push(`      key_file: ${exporter.tlsConfig.keyFile}`);
      }
      if (exporter.compression !== CompressionType.NONE) {
        lines.push(`    compression: ${mapCompression(exporter.compression)}`);
      }
      if (exporter.timeout) {
        lines.push(`    timeout: ${exporter.timeout}ms`);
      }
      if (exporter.headers && Object.keys(exporter.headers).length > 0) {
        lines.push('    headers:');
        Object.entries(exporter.headers).forEach(([k, v]) => {
          lines.push(`      ${k}: ${v}`);
        });
      }
    });
  }
  if (config.metric.enabled && config.metric.exporters?.length > 0) {
    config.metric.exporters.forEach((exporter, idx) => {
      lines.push(`  otlpmetric_${idx}:`);
      lines.push(`    endpoint: ${exporter.endpoint}`);
      lines.push(`    protocol: ${mapProtocol(exporter.protocol)}`);
      lines.push(`    tls:`);
      lines.push(`      insecure: ${exporter.tlsConfig?.insecure ?? true}`);
      if (exporter.compression !== CompressionType.NONE) {
        lines.push(`    compression: ${mapCompression(exporter.compression)}`);
      }
    });
  }
  if (config.log.enabled && config.log.exporters?.length > 0) {
    config.log.exporters.forEach((exporter, idx) => {
      lines.push(`  otlplog_${idx}:`);
      lines.push(`    endpoint: ${exporter.endpoint}`);
      lines.push(`    protocol: ${mapProtocol(exporter.protocol)}`);
      lines.push(`    tls:`);
      lines.push(`      insecure: ${exporter.tlsConfig?.insecure ?? true}`);
      if (exporter.compression !== CompressionType.NONE) {
        lines.push(`    compression: ${mapCompression(exporter.compression)}`);
      }
    });
  }
  lines.push('  logging:');
  lines.push('    verbosity: detailed');
  lines.push('');

  lines.push('service:');
  lines.push('  pipelines:');

  if (config.trace.enabled) {
    const traceExporters = config.trace.exporters?.length > 0
      ? config.trace.exporters.map((_, idx) => `otlptrace_${idx}`).join(', ')
      : 'logging';
    lines.push('    traces:');
    lines.push('      receivers: [otlp]');
    lines.push('      processors: [batch]');
    lines.push(`      exporters: [${traceExporters}]`);
  }

  if (config.metric.enabled) {
    const metricExporters = config.metric.exporters?.length > 0
      ? config.metric.exporters.map((_, idx) => `otlpmetric_${idx}`).join(', ')
      : 'logging';
    lines.push('    metrics:');
    lines.push('      receivers: [otlp]');
    lines.push('      processors: [batch]');
    lines.push(`      exporters: [${metricExporters}]`);
  }

  if (config.log.enabled) {
    const logExporters = config.log.exporters?.length > 0
      ? config.log.exporters.map((_, idx) => `otlplog_${idx}`).join(', ')
      : 'logging';
    lines.push('    logs:');
    lines.push('      receivers: [otlp]');
    lines.push('      processors: [batch]');
    lines.push(`      exporters: [${logExporters}]`);
  }

  return lines.join('\n');
}

export function generateEnvVars(config: OtelSdkConfig): Record<string, string> {
  const env: Record<string, string> = {};

  env['OTEL_SDK_NAME'] = config.sdkName;
  env['OTEL_SDK_VERSION'] = config.sdkVersion;
  env['OTEL_LOG_LEVEL'] = config.logLevel;

  if (config.resource?.serviceName) {
    env['OTEL_SERVICE_NAME'] = config.resource.serviceName;
  }
  if (config.resource?.serviceNamespace) {
    env['OTEL_RESOURCE_ATTRIBUTES'] = `service.namespace=${config.resource.serviceNamespace}`;
  }

  if (config.resource?.attributes) {
    const attrs = Object.entries(config.resource?.attributes || {})
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    if (attrs) {
      env['OTEL_RESOURCE_ATTRIBUTES'] = attrs;
    }
  }

  if (config.propagators?.propagators?.length > 0) {
    env['OTEL_PROPAGATORS'] = config.propagators.propagators.join(',');
  }

  if (config.trace.enabled) {
    env['OTEL_TRACES_ENABLED'] = 'true';
    env['OTEL_EXPORTER_OTLP_TRACES_PROTOCOL'] = mapProtocol(config.trace.protocol);
    env['OTEL_EXPORTER_OTLP_TRACES_ENDPOINT'] = config.trace.endpoint;
    if (config.trace.compression !== CompressionType.NONE) {
      env['OTEL_EXPORTER_OTLP_TRACES_COMPRESSION'] = mapCompression(config.trace.compression);
    }
    env['OTEL_TRACES_SAMPLER'] = mapSampler(config.trace.samplerType);
    if (config.trace.samplerParam !== 1.0) {
      env['OTEL_TRACES_SAMPLER_ARG'] = String(config.trace.samplerParam);
    }
    if (config.trace.spanProcessor) {
      env['OTEL_TRACES_SPAN_PROCESSOR'] = config.trace.spanProcessor;
    }
    if (config.trace.spanLimits) {
      if (config.trace.spanLimits.maxNumberOfAttributes) {
        env['OTEL_TRACES_SPAN_ATTRIBUTE_COUNT_LIMIT'] = String(config.trace.spanLimits.maxNumberOfAttributes);
      }
      if (config.trace.spanLimits.maxNumberOfAttributesPerSpan) {
        env['OTEL_TRACES_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT'] = String(config.trace.spanLimits.maxNumberOfAttributesPerSpan);
      }
      if (config.trace.spanLimits.maxNumberOfEvents) {
        env['OTEL_TRACES_SPAN_EVENT_COUNT_LIMIT'] = String(config.trace.spanLimits.maxNumberOfEvents);
      }
      if (config.trace.spanLimits.maxNumberOfLinks) {
        env['OTEL_TRACES_SPAN_LINK_COUNT_LIMIT'] = String(config.trace.spanLimits.maxNumberOfLinks);
      }
    }
  } else {
    env['OTEL_TRACES_ENABLED'] = 'false';
  }

  if (config.metric.enabled) {
    env['OTEL_METRICS_ENABLED'] = 'true';
    env['OTEL_EXPORTER_OTLP_METRICS_PROTOCOL'] = mapProtocol(config.metric.protocol);
    env['OTEL_EXPORTER_OTLP_METRICS_ENDPOINT'] = config.metric.endpoint;
    if (config.metric.compression !== CompressionType.NONE) {
      env['OTEL_EXPORTER_OTLP_METRICS_COMPRESSION'] = mapCompression(config.metric.compression);
    }
    env['OTEL_METRICS_EXPORT_INTERVAL'] = '60000';
    if (config.metric.temporality) {
      env['OTEL_METRICS_TEMPORALITY'] = config.metric.temporality;
    }
    if (config.metric.aggregation) {
      env['OTEL_METRICS_AGGREGATION'] = config.metric.aggregation;
    }
  } else {
    env['OTEL_METRICS_ENABLED'] = 'false';
  }

  if (config.log.enabled) {
    env['OTEL_LOGS_ENABLED'] = 'true';
    env['OTEL_EXPORTER_OTLP_LOGS_PROTOCOL'] = mapProtocol(config.log.protocol);
    env['OTEL_EXPORTER_OTLP_LOGS_ENDPOINT'] = config.log.endpoint;
    if (config.log.compression !== CompressionType.NONE) {
      env['OTEL_EXPORTER_OTLP_LOGS_COMPRESSION'] = mapCompression(config.log.compression);
    }
    if (config.log.includeTraceId) {
      env['OTEL_LOGS_INCLUDE_TRACE_ID'] = 'true';
    }
    if (config.log.includeSpanId) {
      env['OTEL_LOGS_INCLUDE_SPAN_ID'] = 'true';
    }
    if (config.log.includeLogLevel) {
      env['OTEL_LOGS_INCLUDE_LOG_LEVEL'] = 'true';
    }
    if (config.log.includeResourceAttributes) {
      env['OTEL_LOGS_INCLUDE_RESOURCE_ATTRIBUTES'] = 'true';
    }
  } else {
    env['OTEL_LOGS_ENABLED'] = 'false';
  }

  return env;
}

export function formatEnvVars(envVars: Record<string, string>): string {
  return Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

export function generateNodeJsCode(config: OtelSdkConfig): string {
  const lines: string[] = [];

  lines.push("import { NodeSDK } from '@opentelemetry/sdk-node';");
  lines.push("import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';");
  lines.push("import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';");
  lines.push("import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';");
  lines.push("import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';");
  lines.push("import { BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';");
  lines.push("import { Resource } from '@opentelemetry/resources';");
  lines.push("import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';");
  lines.push('');
  lines.push('const resource = new Resource({');
  if (config.resource?.serviceName) {
    lines.push(`  [SemanticResourceAttributes.SERVICE_NAME]: '${config.resource.serviceName}',`);
  }
  if (config.resource?.serviceNamespace) {
    lines.push(`  [SemanticResourceAttributes.SERVICE_NAMESPACE]: '${config.resource.serviceNamespace}',`);
  }
  if (config.resource?.serviceVersion) {
    lines.push(`  [SemanticResourceAttributes.SERVICE_VERSION]: '${config.resource.serviceVersion}',`);
  }
  if (config.resource?.deploymentEnvironment) {
    lines.push(`  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: '${config.resource.deploymentEnvironment}',`);
  }
  if (config.resource?.attributes) {
    Object.entries(config.resource.attributes).forEach(([k, v]) => {
      lines.push(`  '${k}': '${v}',`);
    });
  }
  lines.push('});');
  lines.push('');

  if (config.trace.enabled && config.trace.exporters?.length > 0) {
    lines.push('const traceExporter = new OTLPTraceExporter({');
    lines.push(`  url: '${config.trace.endpoint}',`);
    if (config.trace.compression !== CompressionType.NONE) {
      lines.push(`  compression: '${mapCompression(config.trace.compression).toUpperCase()}',`);
    }
    lines.push('});');
    lines.push('');

    if (config.trace.spanProcessor === 'simple') {
      lines.push('const spanProcessor = new SimpleSpanProcessor(traceExporter);');
    } else {
      lines.push('const spanProcessor = new BatchSpanProcessor(traceExporter, {');
      if (config.trace.batchConfig) {
        lines.push(`  maxQueueSize: ${config.trace.batchConfig.maxQueueSize},`);
        lines.push(`  maxExportBatchSize: ${config.trace.batchConfig.maxExportBatchSize},`);
        lines.push(`  scheduledDelayMillis: ${config.trace.batchConfig.scheduledDelay},`);
        lines.push(`  exportTimeoutMillis: ${config.trace.batchConfig.exportTimeout},`);
      }
      lines.push('});');
    }
    lines.push('');
  }

  if (config.metric.enabled) {
    lines.push('const metricExporter = new OTLPMetricExporter({');
    lines.push(`  url: '${config.metric.endpoint}',`);
    if (config.metric.compression !== CompressionType.NONE) {
      lines.push(`  compression: '${mapCompression(config.metric.compression).toUpperCase()}',`);
    }
    lines.push('});');
    lines.push('');
    lines.push('const metricReader = new PeriodicExportingMetricReader({');
    lines.push('  exporter: metricExporter,');
    lines.push('  exportIntervalMillis: 60000,');
    lines.push('});');
    lines.push('');
  }

  lines.push('const sdk = new NodeSDK({');
  lines.push('  resource,');
  if (config.trace.enabled && config.trace.exporters?.length > 0) {
    lines.push('  spanProcessor,');
  }
  if (config.metric.enabled) {
    lines.push('  metricReader,');
  }
  lines.push('  instrumentations: [getNodeAutoInstrumentations()],');
  lines.push('});');
  lines.push('');
  lines.push('sdk.start();');
  lines.push('');
  lines.push("process.on('SIGTERM', () => {");
  lines.push('  sdk.shutdown()');
  lines.push('    .then(() => console.log("Tracing terminated"))');
  lines.push('    .catch((error) => console.log("Error terminating tracing", error))');
  lines.push('    .finally(() => process.exit(0));');
  lines.push('});');

  return lines.join('\n');
}

export function generateGoCode(config: OtelSdkConfig): string {
  const lines: string[] = [];

  lines.push('package main');
  lines.push('');
  lines.push('import (');
  lines.push('  "context"');
  lines.push('  "log"');
  lines.push('  "time"');
  lines.push('  ');
  lines.push('  "go.opentelemetry.io/otel"');
  lines.push('  "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"');
  lines.push('  "go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"');
  lines.push('  "go.opentelemetry.io/otel/sdk/metrics"');
  lines.push('  "go.opentelemetry.io/otel/sdk/resource"');
  lines.push('  sdktrace "go.opentelemetry.io/otel/sdk/trace"');
  lines.push('  semconv "go.opentelemetry.io/otel/semconv/v1.21.0"');
  lines.push(')');
  lines.push('');

  lines.push('func main() {');
  lines.push('  ctx := context.Background()');
  lines.push('');
  lines.push('  res, err := resource.New(ctx,');
  lines.push('    resource.withAttributes(');
  if (config.resource?.serviceName) {
    lines.push(`      semconv.ServiceName("${config.resource.serviceName}"),`);
  }
  if (config.resource?.serviceNamespace) {
    lines.push(`      semconv.ServiceNamespace("${config.resource.serviceNamespace}"),`);
  }
  if (config.resource?.serviceVersion) {
    lines.push(`      semconv.ServiceVersion("${config.resource.serviceVersion}"),`);
  }
  if (config.resource?.deploymentEnvironment) {
    lines.push(`      semconv.DeploymentEnvironment("${config.resource.deploymentEnvironment}"),`);
  }
  if (config.resource?.attributes) {
    Object.entries(config.resource.attributes).forEach(([k, v]) => {
      lines.push(`      attribute.String("${k}", "${v}"),`);
    });
  }
  lines.push('    ),');
  lines.push('  )');
  lines.push('  if err != nil {');
  lines.push('    log.Fatal(err)');
  lines.push('  }');
  lines.push('');

  if (config.trace.enabled && config.trace.exporters?.length > 0) {
    const endpoint = config.trace.endpoint.replace('http://', '').replace('https://', '');
    lines.push('  traceExporter, err := otlptracegrpc.New(ctx,');
    lines.push(`    otlptracegrpc.WithEndpoint("${endpoint}"),`);
    lines.push('    otlptracegrpc.WithInsecure(),');
    lines.push('  )');
    lines.push('  if err != nil {');
    lines.push('    log.Fatal(err)');
    lines.push('  }');
    lines.push('');

    lines.push('  tp := sdktrace.NewTracerProvider(');
    lines.push('    sdktrace.WithBatcher(traceExporter),');
    lines.push('    sdktrace.WithResource(res),');
    if (config.trace.samplerType !== SamplerType.ALWAYS_ON) {
      const samplerName = mapSampler(config.trace.samplerType);
      if (config.trace.samplerType === SamplerType.TRACE_ID_RATIO || config.trace.samplerType === SamplerType.PARENT_BASED_TRACE_ID) {
        lines.push(`    sdktrace.WithSampler(sdktrace.TraceIDRatioBasedSampler(${config.trace.samplerParam})),`);
      } else if (samplerName === 'always_off' || samplerName === 'parentbased_always_off') {
        lines.push('    sdktrace.WithSampler(sdktrace.NeverSampleSampler()),');
      } else if (samplerName === 'always_on' || samplerName === 'parentbased_always_on') {
        lines.push('    sdktrace.WithSampler(sdktrace.AlwaysSampleSampler()),');
      }
    }
    lines.push('  )');
    lines.push('  otel.SetTracerProvider(tp)');
    lines.push('');
  }

  if (config.metric.enabled) {
    const endpoint = config.metric.endpoint.replace('http://', '').replace('https://', '');
    lines.push('  metricExporter, err := otlpmetricgrpc.New(ctx,');
    lines.push(`    otlpmetricgrpc.WithEndpoint("${endpoint}"),`);
    lines.push('    otlpmetricgrpc.WithInsecure(),');
    lines.push('  )');
    lines.push('  if err != nil {');
    lines.push('    log.Fatal(err)');
    lines.push('  }');
    lines.push('');

    lines.push('  mp := metrics.NewMeterProvider(');
    lines.push('    metrics.WithResource(res),');
    lines.push('    metrics.WithReader(metrics.NewPeriodicExportReader(metricExporter,');
    lines.push('      metrics.WithInterval(60*time.Second),');
    lines.push('    )),');
    lines.push('  )');
    lines.push('  otel.SetMeterProvider(mp)');
    lines.push('');
  }

  lines.push('  <-ctx.Done()');
  lines.push('}');

  return lines.join('\n');
}

export function generatePythonCode(config: OtelSdkConfig): string {
  const lines: string[] = [];

  lines.push('from opentelemetry import trace');
  lines.push('from opentelemetry.sdk.trace import TracerProvider');
  lines.push('from opentelemetry.sdk.trace.export import BatchSpanProcessor, SimpleSpanProcessor');
  lines.push('from opentelemetry.sdk.resources import Resource, SERVICE_NAME');
  lines.push('from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter');
  lines.push('from opentelemetry.sdk.trace.sampling import ');
  if (config.trace.samplerType === SamplerType.ALWAYS_OFF) {
    lines.push('ALWAYS_OFF');
  } else if (config.trace.samplerType === SamplerType.TRACE_ID_RATIO) {
    lines.push(`TraceIdRatioSampler(${config.trace.samplerParam})`);
  } else if (config.trace.samplerType === SamplerType.PARENT_BASED_TRACE_ID) {
    lines.push(`ParentBased(root=TraceIdRatioSampler(${config.trace.samplerParam}))`);
  } else {
    lines.push('ALWAYS_ON');
  }
  lines.push('');
  lines.push('resource = Resource(attributes={');
  if (config.resource?.serviceName) {
    lines.push(`    SERVICE_NAME: "${config.resource.serviceName}",`);
  }
  if (config.resource?.serviceNamespace) {
    lines.push(`    "service.namespace": "${config.resource.serviceNamespace}",`);
  }
  if (config.resource?.serviceVersion) {
    lines.push(`    "service.version": "${config.resource.serviceVersion}",`);
  }
  if (config.resource?.deploymentEnvironment) {
    lines.push(`    "deployment.environment": "${config.resource.deploymentEnvironment}",`);
  }
  if (config.resource?.attributes) {
    Object.entries(config.resource.attributes).forEach(([k, v]) => {
      lines.push(`    "${k}": "${v}",`);
    });
  }
  lines.push('})');
  lines.push('');

  lines.push('traceProvider = TracerProvider(resource=resource)');

  if (config.trace.enabled && config.trace.exporters?.length > 0) {
    lines.push(`span_exporter = OTLPSpanExporter(endpoint="${config.trace.endpoint}")`);
    if (config.trace.spanProcessor === 'simple') {
      lines.push('traceProvider.add_span_processor(SimpleSpanProcessor(span_exporter))');
    } else {
      lines.push('traceProvider.add_span_processor(BatchSpanProcessor(span_exporter))');
    }
  }

  lines.push('trace.set_tracer_provider(traceProvider)');
  lines.push('');
  lines.push('tracer = trace.get_tracer(__name__)');

  return lines.join('\n');
}

export function generateJavaCode(config: OtelSdkConfig): string {
  const lines: string[] = [];

  lines.push('package com.example;');
  lines.push('');
  lines.push('import io.opentelemetry.api.OpenTelemetry;');
  lines.push('import io.opentelemetry.api.trace.Tracer;');
  lines.push('import io.opentelemetry.sdk.OpenTelemetrySdk;');
  lines.push('import io.opentelemetry.sdk.resources.Resource;');
  lines.push('import io.opentelemetry.sdk.trace.SdkTracerProvider;');
  lines.push('import io.opentelemetry.sdk.trace.export.BatchSpanProcessor;');
  lines.push('import io.opentelemetry.exporter.otlp.trace.OtlpGrpcSpanExporter;');
  lines.push('import io.opentelemetry.semconv.ResourceAttributes;');
  lines.push('import io.opentelemetry.api.common.Attributes;');
  lines.push('import io.opentelemetry.api.common.AttributeKey;');
  lines.push('');
  lines.push('public class OpenTelemetryConfig {');
  lines.push(`  private static final String SERVICE_NAME = "${config.resource?.serviceName || 'unknown-service'}"`);
  lines.push(`  private static final String TRACES_ENDPOINT = "${config.trace.endpoint || 'http://localhost:4317'}"`);
  lines.push(`  private static final String METRICS_ENDPOINT = "${config.metric.endpoint || 'http://localhost:4318'}"`);
  lines.push('');
  lines.push('  public static OpenTelemetry initOpenTelemetry() {');
  lines.push('    Resource resource = Resource.getDefault()');
  lines.push('      .merge(Resource.create(Attributes.of(');
  lines.push('        ResourceAttributes.SERVICE_NAME, SERVICE_NAME');

  if (config.resource?.serviceNamespace) {
    lines.push('        ResourceAttributes.SERVICE_NAMESPACE, AttributeValue.createStringValue("' + config.resource.serviceNamespace + '")');
  }
  if (config.resource?.serviceVersion) {
    lines.push('        ResourceAttributes.SERVICE_VERSION, AttributeValue.createStringValue("' + config.resource.serviceVersion + '")');
  }
  if (config.resource?.deploymentEnvironment) {
    lines.push('        ResourceAttributes.DEPLOYMENT_ENVIRONMENT, AttributeValue.createStringValue("' + config.resource.deploymentEnvironment + '")');
  }
  if (config.resource?.attributes) {
    Object.entries(config.resource.attributes).forEach(([k, v]) => {
      lines.push(`        AttributeKey.stringKey("${k}"), AttributeValue.createStringValue("${v}")`);
    });
  }

  lines.push('      )));');
  lines.push('');
  lines.push('    OtlpGrpcSpanExporter spanExporter = OtlpGrpcSpanExporter.builder()');
  lines.push('      .setEndpoint(TRACES_ENDPOINT)');
  lines.push('      .build();');
  lines.push('');
  lines.push('    SdkTracerProvider tracerProvider = SdkTracerProvider.builder()');
  lines.push('      .addSpanProcessor(BatchSpanProcessor.builder(spanExporter).build())');
  lines.push('      .setResource(resource)');
  lines.push('      .build();');
  lines.push('');
  lines.push('    return OpenTelemetrySdk.builder()');
  lines.push('      .setTracerProvider(tracerProvider)');
  lines.push('      .build();');
  lines.push('  }');
  lines.push('}');

  return lines.join('\n');
}

export function generateCodeSnippet(config: OtelSdkConfig, language: CodeLanguage): string {
  switch (language) {
    case 'node': return generateNodeJsCode(config);
    case 'go': return generateGoCode(config);
    case 'python': return generatePythonCode(config);
    case 'java': return generateJavaCode(config);
    default: return generateNodeJsCode(config);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateScenarioYaml(
  name: string,
  _telemetryType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  traceConfig: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metricConfig: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logConfig: any
): string {
  const lines: string[] = [];
  const INDENT = '  ';

  lines.push('# Scenario Configuration');
  lines.push(`# Name: ${name}`);
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push('');

  // Ensure we have valid objects
  const safeTrace = traceConfig || {};
  const safeMetric = metricConfig || {};
  const safeLog = logConfig || {};

  // Resource
  lines.push('resource:');
  lines.push(`${INDENT}serviceName: "${name}"`);
  const svcName = safeTrace.serviceName || safeMetric.serviceName || safeLog.serviceName;
  if (svcName) {
    lines.push(`${INDENT}serviceName: "${svcName}"`);
  }
  lines.push('');

  // Trace Configuration
  lines.push('trace:');
  lines.push(`${INDENT}enabled: ${safeTrace.enabled ?? true}`);
  lines.push(`${INDENT}samplingRatio: ${safeTrace.samplingRatio ?? 1.0}`);
  
  const spans = safeTrace.spans;
  if (Array.isArray(spans) && spans.length > 0) {
    lines.push(`${INDENT}spans:`);
    
    spans.forEach((span: any) => {
      if (!span) return;
      lines.push(`${INDENT}${INDENT}- id: "${span.id || 'unknown'}"`);
      if (span.parentSpanId) {
        lines.push(`${INDENT}${INDENT}  parentSpanId: "${span.parentSpanId}"`);
      }
      lines.push(`${INDENT}${INDENT}  name: "${span.name || 'unnamed'}"`);
      lines.push(`${INDENT}${INDENT}  kind: ${span.kind || 'internal'}`);
      lines.push(`${INDENT}${INDENT}  statusCode: ${span.statusCode || 'UNSET'}`);
      lines.push(`${INDENT}${INDENT}  durationMs: ${span.durationMs || 100}`);
      
      // Attributes
      const spanAttrs = span.attributes;
      if (spanAttrs && typeof spanAttrs === 'object' && Object.keys(spanAttrs).length > 0) {
        lines.push(`${INDENT}${INDENT}  attributes:`);
        Object.entries(spanAttrs).forEach(([k, v]) => {
          lines.push(`${INDENT}${INDENT}${INDENT}${k}: ${JSON.stringify(v)}`);
        });
      }
      
      // Events
      const events = span.events;
      if (Array.isArray(events) && events.length > 0) {
        lines.push(`${INDENT}${INDENT}  events:`);
        events.forEach((event: any) => {
          if (!event) return;
          lines.push(`${INDENT}${INDENT}${INDENT}- name: "${event.name || ''}"`);
          lines.push(`${INDENT}${INDENT}${INDENT}  timestampOffsetMs: ${event.timestampOffsetMs ?? 0}`);
          const eventAttrs = event.attributes;
          if (eventAttrs && typeof eventAttrs === 'object' && Object.keys(eventAttrs).length > 0) {
            lines.push(`${INDENT}${INDENT}${INDENT}  attributes:`);
            Object.entries(eventAttrs).forEach(([k, v]) => {
              lines.push(`${INDENT}${INDENT}${INDENT}${INDENT}${k}: ${JSON.stringify(v)}`);
            });
          }
        });
      }
      
      // Links
      const links = span.links;
      if (Array.isArray(links) && links.length > 0) {
        lines.push(`${INDENT}${INDENT}  links:`);
        links.forEach((link: any) => {
          if (!link) return;
          lines.push(`${INDENT}${INDENT}${INDENT}- traceId: "${link.traceId || ''}"`);
          lines.push(`${INDENT}${INDENT}${INDENT}  spanId: "${link.spanId || ''}"`);
          const linkAttrs = link.attributes;
          if (linkAttrs && typeof linkAttrs === 'object' && Object.keys(linkAttrs).length > 0) {
            lines.push(`${INDENT}${INDENT}${INDENT}  attributes:`);
            Object.entries(linkAttrs).forEach(([k, v]) => {
              lines.push(`${INDENT}${INDENT}${INDENT}${INDENT}${k}: ${JSON.stringify(v)}`);
            });
          }
        });
      }
    });
  } else {
    lines.push(`${INDENT}spans: []`);
  }
  lines.push('');

  // Metric Configuration
  lines.push('metric:');
  lines.push(`${INDENT}enabled: ${safeMetric.enabled ?? true}`);
  if (safeMetric.temporality) {
    lines.push(`${INDENT}temporality: ${safeMetric.temporality}`);
  }
  if (safeMetric.aggregation) {
    lines.push(`${INDENT}aggregation: ${safeMetric.aggregation}`);
  }
  const readers = safeMetric.readers;
  if (Array.isArray(readers) && readers.length > 0) {
    lines.push(`${INDENT}readers:`);
    readers.forEach((reader: string) => {
      lines.push(`${INDENT}${INDENT}- ${reader}`);
    });
  }
  
  // Metric Attributes
  const metricAttrs = safeMetric.metricAttributes;
  if (metricAttrs && typeof metricAttrs === 'object' && Object.keys(metricAttrs).length > 0) {
    lines.push(`${INDENT}attributes:`);
    Object.entries(metricAttrs).forEach(([k, v]) => {
      lines.push(`${INDENT}${INDENT}${k}: ${JSON.stringify(v)}`);
    });
  }
  
  // Metrics
  const metrics = safeMetric.metrics;
  if (Array.isArray(metrics) && metrics.length > 0) {
    lines.push(`${INDENT}metrics:`);
    metrics.forEach((metric: any) => {
      if (!metric) return;
      lines.push(`${INDENT}${INDENT}- name: "${metric.name || 'unnamed'}"`);
      lines.push(`${INDENT}${INDENT}  type: ${metric.type || 'counter'}`);
      lines.push(`${INDENT}${INDENT}  value: ${metric.value ?? 1}`);
      lines.push(`${INDENT}${INDENT}  unit: "${metric.unit || '1'}"`);
      
      // Labels
      const labels = metric.labels;
      if (labels && typeof labels === 'object' && Object.keys(labels).length > 0) {
        lines.push(`${INDENT}${INDENT}  labels:`);
        Object.entries(labels).forEach(([k, v]) => {
          lines.push(`${INDENT}${INDENT}${INDENT}${k}: ${JSON.stringify(v)}`);
        });
      }
      
      // Histogram buckets
      const buckets = metric.histogramBuckets;
      if (Array.isArray(buckets) && buckets.length > 0) {
        lines.push(`${INDENT}${INDENT}  histogramBuckets: [${buckets.join(', ')}]`);
      }
    });
  } else {
    lines.push(`${INDENT}metrics: []`);
  }
  lines.push('');

  // Log Configuration
  lines.push('log:');
  lines.push(`${INDENT}enabled: ${safeLog.enabled ?? true}`);
  lines.push(`${INDENT}includeTraceId: ${safeLog.includeTraceId ?? true}`);
  lines.push(`${INDENT}includeSpanId: ${safeLog.includeSpanId ?? true}`);
  lines.push(`${INDENT}includeResourceAttributes: ${safeLog.includeResourceAttributes ?? true}`);
  lines.push(`${INDENT}includeLogLevel: ${safeLog.includeLogLevel ?? true}`);
  lines.push(`${INDENT}includeSystemAttributes: ${safeLog.includeSystemAttributes ?? false}`);
  
  // Log Attributes
  const logAttrs = safeLog.logAttributes;
  if (logAttrs && typeof logAttrs === 'object' && Object.keys(logAttrs).length > 0) {
    lines.push(`${INDENT}attributes:`);
    Object.entries(logAttrs).forEach(([k, v]) => {
      lines.push(`${INDENT}${INDENT}${k}: ${JSON.stringify(v)}`);
    });
  }
  
  // Log Records
  const logs = safeLog.logs;
  if (Array.isArray(logs) && logs.length > 0) {
    lines.push(`${INDENT}logs:`);
    logs.forEach((log: any) => {
      if (!log) return;
      lines.push(`${INDENT}${INDENT}- body: "${log.body || ''}"`);
      lines.push(`${INDENT}${INDENT}  severityText: "${log.severityText || 'Info'}"`);
      lines.push(`${INDENT}${INDENT}  severityNumber: ${log.severityNumber ?? 9}`);
      const logAttrs2 = log.attributes;
      if (logAttrs2 && typeof logAttrs2 === 'object' && Object.keys(logAttrs2).length > 0) {
        lines.push(`${INDENT}${INDENT}  attributes:`);
        Object.entries(logAttrs2).forEach(([k, v]) => {
          lines.push(`${INDENT}${INDENT}${INDENT}${k}: ${JSON.stringify(v)}`);
        });
      }
    });
  } else {
    lines.push(`${INDENT}logs: []`);
  }

  return lines.join('\n');
}
