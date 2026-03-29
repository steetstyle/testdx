import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from 'zod-express-middleware';
import { objectIdSchema, mockAuth } from './schemas/base';
import {
  getScenarios,
  getScenario,
  createScenario,
  updateScenario,
  deleteScenario,
} from '../controllers/scenarios';
import {
  runScenario,
  startSchedule,
  stopSchedule,
  stopScenario,
  getScenarioHistory,
  getScenarioProgress,
} from '../controllers/execution';
import { importFromYaml } from '../controllers/import';
import { calculateRatePreview } from '../services/syntheticRunner/utils/rateCalculator';

const router = express.Router();

const SpanEventSchema = z.object({
  name: z.string().default('event'),
  timestampOffsetMs: z.union([z.number(), z.string()]).default(0),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
});

const SpanLinkSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
});

const SpanConfigSchema = z.object({
  name: z.string().default('operation'),
  kind: z.enum(['server', 'client', 'producer', 'consumer', 'internal']).default('server'),
  statusCode: z.union([z.string(), z.number()]).default('OK'),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
  events: z.array(SpanEventSchema).default([]),
  links: z.array(SpanLinkSchema).default([]),
  childSpans: z.union([z.number(), z.string()]).default(2),
  durationMs: z.union([z.number(), z.string()]).default(100),
});

const MetricPointSchema = z.object({
  name: z.string(),
  type: z.enum(['counter', 'gauge', 'histogram', 'exponential_histogram', 'sum']).default('counter'),
  value: z.union([z.number(), z.string()]).default(1),
  unit: z.string().default('1'),
  labels: z.record(z.string()).default({}),
  histogramBuckets: z.array(z.number()).optional(),
});

const DistributionObjectSchema = z.object({
  gaussian: z.object({ mean: z.number(), stdDev: z.number() }).optional(),
  uniform: z.object({ min: z.number(), max: z.number() }).optional(),
  linear: z.object({ start: z.number(), end: z.number() }).optional(),
  exponential: z.object({ lambda: z.number() }).optional(),
  poisson: z.object({ lambda: z.number() }).optional(),
}).passthrough();

const VariableValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.array(z.number()),
  DistributionObjectSchema,
]);

const LogRecordSchema = z.object({
  severityNumber: z.union([z.number(), z.string()]).default(9),
  severityText: z.string().default('Info'),
  body: z.string().default('Log message'),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
});

const UnifiedParamsSchema = z.object({
  includeTraces: z.boolean().default(true),
  includeMetrics: z.boolean().default(true),
  includeLogs: z.boolean().default(true),
  correlationEnabled: z.boolean().default(true),
  rootSpan: SpanConfigSchema.default(() => ({})),
  traceAttributes: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
  metrics: z.array(MetricPointSchema).default([]),
  logs: z.array(LogRecordSchema).default([]),
});

const TraceParamsSchema = z.object({
  rootSpanName: z.string().default('operation'),
  rootSpan: SpanConfigSchema.default(() => ({})),
  traceAttributes: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
});

const MetricParamsSchema = z.object({
  metrics: z.array(MetricPointSchema).default([]),
  metricAttributes: z.record(z.string()).default({}),
});

const LogParamsSchema = z.object({
  logs: z.array(LogRecordSchema).default([]),
  logAttributes: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
  includeTraceId: z.boolean().default(true),
});

const UniformConfigSchema = z.object({
  type: z.literal('uniform'),
  min: z.number().default(1),
  max: z.number().default(10),
});

const GaussianConfigSchema = z.object({
  type: z.literal('gaussian'),
  mean: z.number().default(10),
  stdDev: z.number().default(2),
});

const LinearRampConfigSchema = z.object({
  type: z.literal('linearRamp'),
  start: z.number().default(5),
  end: z.number().default(20),
  duration: z.number().default(1),
});

const ExponentialRampConfigSchema = z.object({
  type: z.literal('exponentialRamp'),
  start: z.number().default(5),
  growth: z.number().default(1.1),
  duration: z.number().default(1),
  max: z.number().optional(),
});

const SineWaveConfigSchema = z.object({
  type: z.literal('sine'),
  base: z.number().default(10),
  amplitude: z.number().default(5),
  period: z.number().default(10),
  phase: z.number().default(0),
});

const SquareWaveConfigSchema = z.object({
  type: z.literal('square'),
  min: z.number().default(5),
  max: z.number().default(20),
  period: z.number().default(10),
});

const TriangleWaveConfigSchema = z.object({
  type: z.literal('triangle'),
  min: z.number().default(5),
  max: z.number().default(20),
  period: z.number().default(10),
});

const BurstConfigSchema = z.object({
  type: z.literal('burst'),
  baseRate: z.number().default(5),
  burstRate: z.number().default(50),
  probability: z.number().default(0.1),
});

const PoissonConfigSchema = z.object({
  type: z.literal('poisson'),
  lambda: z.number().default(10),
});

const ExponentialConfigSchema = z.object({
  type: z.literal('exponential'),
  lambda: z.number().default(1),
});

const FixedConfigSchema = z.object({
  type: z.literal('fixed'),
  rate: z.number().default(10),
});

const DistributionConfigSchema: z.ZodType<any> = z.discriminatedUnion('type', [
  UniformConfigSchema,
  GaussianConfigSchema,
  LinearRampConfigSchema,
  ExponentialRampConfigSchema,
  SineWaveConfigSchema,
  SquareWaveConfigSchema,
  TriangleWaveConfigSchema,
  BurstConfigSchema,
  PoissonConfigSchema,
  ExponentialConfigSchema,
  FixedConfigSchema,
]).or(z.object({
  type: z.string(),
}).passthrough());

const ScheduleConfigSchema = z.object({
  enabled: z.boolean().default(false),
  cronExpression: z.string().optional(),
  intervalMs: z.number().optional(),
});

const RunLimitsSchema = z.object({
  maxConcurrent: z.number().min(1).max(10).default(1),
  maxPerHour: z.number().min(1).max(1000).default(100),
});

const CreateScenarioSchema = z.object({
  projectId: z.string(),
  serviceId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  telemetryType: z.enum(['traces', 'metrics', 'logs', 'unified']),
  params: z.union([
    UnifiedParamsSchema,
    TraceParamsSchema,
    MetricParamsSchema,
    LogParamsSchema,
  ]).default(() => ({})),
  attributes: z.record(z.string()).default({}),
  distribution: DistributionConfigSchema.default({ type: 'fixed', rate: 10 }),
  variables: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number()), z.object({})])).optional(),
  schedule: ScheduleConfigSchema.optional(),
  limits: RunLimitsSchema.default({ maxConcurrent: 1, maxPerHour: 100 }),
  isActive: z.boolean().default(false),
});

const RunScenarioSchema = z.object({
  mode: z.enum(['realtime', 'historical']).default('realtime'),
  duration: z.number().optional(),
  timeRange: z.object({
    start: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid datetime' }),
    end: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid datetime' })
  }).optional(),
});

router.use(mockAuth);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, serviceId } = req.query;
    const scenarios = await getScenarios(
      (req as any).teamId,
      projectId as string | undefined,
      serviceId as string | undefined
    );
    res.json(scenarios);
  } catch (e) { next(e); }
});

router.post('/', validateRequest({ body: CreateScenarioSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenario = await createScenario((req as any).teamId, req.body);
    res.status(201).json(scenario);
  } catch (e) { next(e); }
});

router.get('/:id', validateRequest({ params: z.object({ id: objectIdSchema }) }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenario = await getScenario((req as any).teamId, String(req.params.id));
    if (!scenario) { res.status(404).send('Scenario not found'); return; }
    res.json(scenario);
  } catch (e) { next(e); }
});

router.put('/:id', validateRequest({ params: z.object({ id: objectIdSchema }), body: CreateScenarioSchema.partial() }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[PUT] req.body:', JSON.stringify(req.body));
    const scenario = await updateScenario((req as any).teamId, String(req.params.id), req.body);
    if (!scenario) { res.status(404).send('Scenario not found'); return; }
    res.json(scenario);
  } catch (e) { next(e); }
});

router.delete('/:id', validateRequest({ params: z.object({ id: objectIdSchema }) }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteScenario((req as any).teamId, String(req.params.id));
    res.status(204).send();
  } catch (e) { next(e); }
});

router.post('/:id/run', validateRequest({ params: z.object({ id: objectIdSchema }), body: RunScenarioSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await runScenario(
      (req as any).teamId,
      String(req.params.id),
      req.body.mode || 'realtime',
      req.body.duration,
      req.body.timeRange ? { start: new Date(req.body.timeRange.start), end: new Date(req.body.timeRange.end) } : undefined,
    );
    if (!result.success) { res.status(400).json(result); return; }
    res.json(result);
  } catch (e) { next(e); }
});

router.post('/:id/stop', validateRequest({ params: z.object({ id: objectIdSchema }) }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await stopScenario((req as any).teamId, String(req.params.id));
    if (!result.success) { res.status(400).json({ error: 'Scenario is not running' }); return; }
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.post('/:id/schedule/start', validateRequest({ params: z.object({ id: objectIdSchema }) }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenario = await startSchedule((req as any).teamId, String(req.params.id));
    if (!scenario) { res.status(404).send('Scenario not found'); return; }
    res.json(scenario);
  } catch (e) { next(e); }
});

router.post('/:id/schedule/stop', validateRequest({ params: z.object({ id: objectIdSchema }) }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await stopSchedule((req as any).teamId, String(req.params.id));
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.get('/:id/history', validateRequest({ params: z.object({ id: objectIdSchema }) }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await getScenarioHistory((req as any).teamId, String(req.params.id));
    res.json(history);
  } catch (e) { next(e); }
});

router.get('/:id/progress', validateRequest({ params: z.object({ id: objectIdSchema }) }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const progress = await getScenarioProgress((req as any).teamId, String(req.params.id));
    res.json(progress);
  } catch (e) { next(e); }
});

const DistributionPreviewSchema = z.object({
  distribution: DistributionConfigSchema,
  duration: z.number().min(1).max(3600).default(60),
  samples: z.number().min(1).max(360).default(60),
});

router.post('/preview-distribution', validateRequest({ body: DistributionPreviewSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { distribution, duration, samples } = req.body;
    const preview = calculateRatePreview(distribution, duration, samples);
    res.json({
      duration,
      samples: preview.length,
      points: preview,
    });
  } catch (e) { next(e); }
});

router.post('/import/yaml', validateRequest({ body: z.object({ yaml: z.string().min(1) }) }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await importFromYaml((req as any).teamId, req.body.yaml);
    res.status(201).json(result);
  } catch (e) { next(e); }
});

export default router;