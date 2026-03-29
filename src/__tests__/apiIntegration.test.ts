import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validateRequest } from 'zod-express-middleware';

const app = express();
app.use(express.json());

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/);

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  otelCollectorEndpoint: z.string().default('http://localhost:4318'),
  projectVariables: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number()), z.record(z.unknown())])).optional(),
});

const CreateProjectSchemaPartial = CreateProjectSchema.partial();

const CreateServiceSchema = z.object({
  projectId: z.string().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  otelSdkConfig: z.object({}).optional(),
  serviceVariables: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number()), z.record(z.unknown())])).optional(),
});

const CreateServiceSchemaPartial = CreateServiceSchema.partial();

const DistributionConfigSchema = z.object({
  type: z.enum(['uniform', 'linear', 'gaussian', 'normal', 'burst', 'exponential', 'poisson']).default('uniform'),
  rate: z.union([z.number(), z.string()]).optional(),
  startRate: z.union([z.number(), z.string()]).optional(),
  endRate: z.union([z.number(), z.string()]).optional(),
  minRate: z.union([z.number(), z.string()]).optional(),
  maxRate: z.union([z.number(), z.string()]).optional(),
  baseRate: z.union([z.number(), z.string()]).optional(),
  burstRate: z.union([z.number(), z.string()]).optional(),
  burstInterval: z.string().optional(),
  mean: z.union([z.number(), z.string()]).optional(),
  stdDev: z.union([z.number(), z.string()]).optional(),
  interval: z.string().default('1s'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const RunScenarioSchema = z.object({
  mode: z.enum(['realtime', 'historical']).default('realtime'),
  timeRange: z.object({ 
    start: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid datetime' }), 
    end: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid datetime' }) 
  }).optional(),
});

app.post('/projects', validateRequest({ body: CreateProjectSchema }), (req, res) => {
  res.status(201).json(req.body);
});

app.put('/projects/:id', validateRequest({ params: z.object({ id: objectIdSchema }), body: CreateProjectSchemaPartial }), (req, res) => {
  res.status(200).json(req.body);
});

app.post('/services', validateRequest({ body: CreateServiceSchema }), (req, res) => {
  res.status(201).json(req.body);
});

app.put('/services/:id', validateRequest({ params: z.object({ id: objectIdSchema }), body: CreateServiceSchemaPartial }), (req, res) => {
  res.status(200).json(req.body);
});

app.post('/scenarios/run', validateRequest({ body: RunScenarioSchema }), (req, res) => {
  res.status(200).json({ success: true, ...req.body });
});

describe('Project Schema Validation', () => {
  describe('CreateProjectSchema', () => {
    it('should accept project with projectVariables', () => {
      const result = CreateProjectSchema.safeParse({
        name: 'Test Project',
        projectVariables: { env: 'test', region: 'us-west-2' },
      });
      expect(result.success).toBe(true);
    });

    it('should accept project with array variables', () => {
      const result = CreateProjectSchema.safeParse({
        name: 'Test',
        projectVariables: { flags: ['a', 'b'], counts: [1, 2, 3] },
      });
      expect(result.success).toBe(true);
    });

    it('should accept project without projectVariables', () => {
      const result = CreateProjectSchema.safeParse({
        name: 'Simple Project',
      });
      expect(result.success).toBe(true);
    });

    it('should reject project without name', () => {
      const result = CreateProjectSchema.safeParse({
        description: 'No name',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateProjectSchema.partial() (for updates)', () => {
    it('should accept partial update with projectVariables', () => {
      const result = CreateProjectSchemaPartial.safeParse({
        projectVariables: { newVar: 'value' },
      });
      expect(result.success).toBe(true);
    });

    it('should accept partial update with just name', () => {
      const result = CreateProjectSchemaPartial.safeParse({
        name: 'Updated Name',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty partial update', () => {
      const result = CreateProjectSchemaPartial.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});

describe('Service Schema Validation', () => {
  describe('CreateServiceSchema', () => {
    it('should accept service with serviceVariables', () => {
      const result = CreateServiceSchema.safeParse({
        name: 'Test Service',
        serviceVariables: { timeout: 30, retries: 3 },
      });
      expect(result.success).toBe(true);
    });

    it('should accept service without serviceVariables', () => {
      const result = CreateServiceSchema.safeParse({
        name: 'Simple Service',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('CreateServiceSchema.partial() (for updates)', () => {
    it('should accept partial update with serviceVariables', () => {
      const result = CreateServiceSchemaPartial.safeParse({
        serviceVariables: { updated: 'var' },
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty partial update', () => {
      const result = CreateServiceSchemaPartial.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});

describe('Distribution Schema Validation', () => {
  it('should accept uniform distribution', () => {
    const result = DistributionConfigSchema.safeParse({
      type: 'uniform',
      rate: 10,
    });
    expect(result.success).toBe(true);
  });

  it('should accept gaussian distribution with numeric values', () => {
    const result = DistributionConfigSchema.safeParse({
      type: 'gaussian',
      mean: 100,
      stdDev: 20,
      rate: 10,
    });
    expect(result.success).toBe(true);
  });

  it('should accept gaussian distribution with string values (from YAML)', () => {
    const result = DistributionConfigSchema.safeParse({
      type: 'gaussian',
      mean: '100',
      stdDev: '20',
      rate: '10',
    });
    expect(result.success).toBe(true);
  });

  it('should accept linear distribution', () => {
    const result = DistributionConfigSchema.safeParse({
      type: 'linear',
      minRate: 5,
      maxRate: 50,
    });
    expect(result.success).toBe(true);
  });

  it('should accept burst distribution', () => {
    const result = DistributionConfigSchema.safeParse({
      type: 'burst',
      burstRate: 100,
      baseRate: 10,
    });
    expect(result.success).toBe(true);
  });

  it('should accept exponential distribution', () => {
    const result = DistributionConfigSchema.safeParse({
      type: 'exponential',
      rate: 10,
    });
    expect(result.success).toBe(true);
  });

  it('should accept poisson distribution', () => {
    const result = DistributionConfigSchema.safeParse({
      type: 'poisson',
      mean: 10,
    });
    expect(result.success).toBe(true);
  });

  it('should accept historical mode with dates', () => {
    const result = DistributionConfigSchema.safeParse({
      type: 'uniform',
      rate: 10,
      startDate: '2026-03-01T00:00:00Z',
      endDate: '2026-03-07T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('should accept all distribution types', () => {
    const types = ['uniform', 'linear', 'gaussian', 'normal', 'burst', 'exponential', 'poisson'];
    for (const type of types) {
      const result = DistributionConfigSchema.safeParse({ type, rate: 10 });
      expect(result.success).toBe(true);
    }
  });
});

describe('Run Scenario Schema Validation', () => {
  describe('RunScenarioSchema', () => {
    it('should accept realtime mode', () => {
      const result = RunScenarioSchema.safeParse({ mode: 'realtime' });
      expect(result.success).toBe(true);
    });

    it('should accept historical mode', () => {
      const result = RunScenarioSchema.safeParse({ mode: 'historical' });
      expect(result.success).toBe(true);
    });

    it('should accept timeRange with ISO format', () => {
      const result = RunScenarioSchema.safeParse({
        mode: 'historical',
        timeRange: {
          start: '2026-03-01T00:00:00.000Z',
          end: '2026-03-07T12:30:00.000Z',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should accept timeRange with simple date format', () => {
      const result = RunScenarioSchema.safeParse({
        mode: 'historical',
        timeRange: {
          start: '2026-03-01T00:00',
          end: '2026-03-07T00:00',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty body (uses defaults)', () => {
      const result = RunScenarioSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject invalid datetime', () => {
      const result = RunScenarioSchema.safeParse({
        timeRange: {
          start: 'invalid-date',
          end: 'also-invalid',
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid mode', () => {
      const result = RunScenarioSchema.safeParse({
        mode: 'invalid-mode',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('API Endpoint Integration Tests', () => {
  const validObjectId = '507f1f77bcf86cd799439011';

  describe('POST /projects', () => {
    it('should accept valid project with projectVariables', async () => {
      const response = await request(app)
        .post('/projects')
        .send({
          name: 'Test Project',
          projectVariables: { env: 'test' },
        });
      expect(response.status).toBe(201);
    });

    it('should accept project with nested variables', async () => {
      const response = await request(app)
        .post('/projects')
        .send({
          name: 'Nested Vars',
          projectVariables: {
            env: 'prod',
            counts: [1, 2, 3],
            nested: { a: 1, b: 2 },
          },
        });
      expect(response.status).toBe(201);
    });
  });

  describe('PUT /projects/:id', () => {
    it('should accept partial update with projectVariables', async () => {
      const response = await request(app)
        .put(`/projects/${validObjectId}`)
        .send({
          projectVariables: { updated: 'value' },
        });
      expect(response.status).toBe(200);
    });

    it('should accept partial update with just name', async () => {
      const response = await request(app)
        .put(`/projects/${validObjectId}`)
        .send({ name: 'New Name' });
      expect(response.status).toBe(200);
    });
  });

  describe('POST /services', () => {
    it('should accept valid service with serviceVariables', async () => {
      const response = await request(app)
        .post('/services')
        .send({
          name: 'Test Service',
          serviceVariables: { timeout: 30 },
        });
      expect(response.status).toBe(201);
    });
  });

  describe('PUT /services/:id', () => {
    it('should accept partial update with serviceVariables', async () => {
      const response = await request(app)
        .put(`/services/${validObjectId}`)
        .send({
          serviceVariables: { updated: 'var' },
        });
      expect(response.status).toBe(200);
    });
  });

  describe('POST /scenarios/run', () => {
    it('should accept realtime mode', async () => {
      const response = await request(app)
        .post('/scenarios/run')
        .send({ mode: 'realtime' });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should accept historical mode with timeRange', async () => {
      const response = await request(app)
        .post('/scenarios/run')
        .send({
          mode: 'historical',
          timeRange: {
            start: '2026-03-01T00:00',
            end: '2026-03-07T00:00',
          },
        });
      expect(response.status).toBe(200);
    });

    it('should accept ISO datetime format', async () => {
      const response = await request(app)
        .post('/scenarios/run')
        .send({
          mode: 'historical',
          timeRange: {
            start: '2026-03-01T00:00:00.000Z',
            end: '2026-03-07T12:30:00.000Z',
          },
        });
      expect(response.status).toBe(200);
    });

    it('should reject invalid datetime', async () => {
      const response = await request(app)
        .post('/scenarios/run')
        .send({
          timeRange: {
            start: 'not-a-date',
            end: 'also-not',
          },
        });
      expect(response.status).toBe(400);
    });

    it('should reject invalid mode', async () => {
      const response = await request(app)
        .post('/scenarios/run')
        .send({ mode: 'invalid' });
      expect(response.status).toBe(400);
    });
  });
});

describe('End-to-End Scenario Validation', () => {
  it('should validate complete scenario with all fields', () => {
    const scenarioSchema = z.object({
      projectId: z.string(),
      serviceId: z.string(),
      name: z.string(),
      telemetryType: z.enum(['traces', 'metrics', 'logs', 'unified']),
      variables: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
      distribution: DistributionConfigSchema,
    });

    const result = scenarioSchema.safeParse({
      projectId: '507f1f77bcf86cd799439011',
      serviceId: '507f1f77bcf86cd799439011',
      name: 'Test Scenario',
      telemetryType: 'unified',
      variables: { userId: '123', sessionId: '${uuid}' },
      distribution: {
        type: 'gaussian',
        mean: '100',
        stdDev: '20',
        rate: '10',
        startDate: '2026-03-01T00:00:00Z',
        endDate: '2026-03-07T00:00:00Z',
      },
    });

    expect(result.success).toBe(true);
  });

  it('should validate metrics-only scenario', () => {
    const metricsScenarioSchema = z.object({
      projectId: z.string(),
      serviceId: z.string(),
      name: z.string(),
      telemetryType: z.literal('metrics'),
      params: z.object({
        metrics: z.array(z.object({
          name: z.string(),
          type: z.enum(['counter', 'gauge', 'histogram']),
          value: z.union([z.number(), z.string()]),
        })),
      }),
      distribution: DistributionConfigSchema,
    });

    const result = metricsScenarioSchema.safeParse({
      projectId: '507f1f77bcf86cd799439011',
      serviceId: '507f1f77bcf86cd799439011',
      name: 'Metrics Test',
      telemetryType: 'metrics',
      params: {
        metrics: [
          { name: 'cpu_usage', type: 'gauge', value: '${gaussian}' },
          { name: 'request_count', type: 'counter', value: '10' },
        ],
      },
      distribution: {
        type: 'gaussian',
        mean: '65',
        stdDev: '15',
        rate: '1',
      },
    });

    expect(result.success).toBe(true);
  });
});
