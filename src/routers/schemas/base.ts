import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const mockAuth = (req: Request, res: Response, next: NextFunction) => {
  (req as any).teamId = req.headers['x-team-id'] || '507f1f77bcf86cd799439011';
  next();
};

export const PropagatorTypeSchema = z.enum(['w3c', 'b3', 'b3_single', 'jaeger', 'xray', 'ottrace']);
export const CompressionTypeSchema = z.enum(['none', 'gzip', 'zstd']);
export const SamplerTypeSchema = z.enum(['always_on', 'always_off', 'parentbased_always_on', 'parentbased_always_off', 'parentbased_traceidratio', 'traceidratio']);
export const ExporterTypeSchema = z.enum(['otlp', 'jaeger', 'zipkin', 'prometheus', 'console']);
export const SpanProcessorTypeSchema = z.enum(['batch', 'simple']);
export const MetricTemporalitySchema = z.enum(['cumulative', 'delta']);
export const AggregationTypeSchema = z.enum(['drop', 'last_value', 'sum', 'histogram', 'exponential_histogram']);
export const MetricReaderTypeSchema = z.enum(['periodic', 'pull']);