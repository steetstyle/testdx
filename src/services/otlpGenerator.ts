import { OtelGenerator } from './otel/generator';
export * from './otel/types';
export * from './otel/idGenerator';
export * from './otel/payloadBuilder';
export * from './otel/generator';

class OtlpGenerator extends OtelGenerator {
  constructor(endpoint: string = 'http://localhost:4318', timeout: number = 30000) {
    super({ endpoint, timeout });
  }
}

export default OtlpGenerator;