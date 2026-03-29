import { Service } from '../../models/service';
import { OtelGenerator } from '../otel';
import { OTLP_ENDPOINT } from './utils/constants';
import { GeneratorOptions } from './utils/types';

export async function getServiceEndpoint(serviceId: string): Promise<string> {
  try {
    const service = await Service.findById(serviceId);
    const endpoint = service?.otelSdkConfig?.trace?.endpoint || OTLP_ENDPOINT;
    console.log(`[ServiceResolver] Using OTLP endpoint for service ${serviceId}: ${endpoint}`);
    return endpoint;
  } catch (err) {
    console.error(`[ServiceResolver] Failed to get endpoint for service ${serviceId}:`, err);
    return OTLP_ENDPOINT;
  }
}

export async function getServiceName(serviceId: string): Promise<string> {
  try {
    const service = await Service.findById(serviceId);
    return service?.otelSdkConfig?.trace?.serviceName || 'synthetic-service';
  } catch {
    return 'synthetic-service';
  }
}

export async function createGenerator(serviceId: string): Promise<OtelGenerator> {
  const endpoint = await getServiceEndpoint(serviceId);
  const serviceName = await getServiceName(serviceId);

  let headers: Record<string, string> | undefined;
  try {
    const service = await Service.findById(serviceId);
    const traceExporter = service?.otelSdkConfig?.trace?.exporters?.[0];
    if (traceExporter?.headers) {
      headers = traceExporter.headers;
    }
  } catch {
    // Ignore errors, headers will be undefined
  }

  return new OtelGenerator({ endpoint, serviceName, headers });
}

export async function getServiceOptions(serviceId: string): Promise<GeneratorOptions> {
  const endpoint = await getServiceEndpoint(serviceId);
  const serviceName = await getServiceName(serviceId);

  let headers: Record<string, string> | undefined;
  try {
    const service = await Service.findById(serviceId);
    const traceExporter = service?.otelSdkConfig?.trace?.exporters?.[0];
    if (traceExporter?.headers) {
      headers = traceExporter.headers;
    }
  } catch {
    // Ignore errors, headers will be undefined
  }

  return { endpoint, serviceName, headers };
}