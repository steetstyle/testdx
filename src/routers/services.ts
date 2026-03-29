import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from 'zod-express-middleware';
import { objectIdSchema, mockAuth } from './schemas/base';
import { OtelSdkConfigSchema } from './schemas/otel';
import {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
} from '../controllers/services';

const router = express.Router();

const CreateServiceSchema = z.object({
  projectId: z.string().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  otelSdkConfig: OtelSdkConfigSchema.optional(),
  serviceVariables: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number()), z.record(z.unknown())])).optional(),
});

router.use(mockAuth);

router.get('/projects/:projectId/services', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await getServices((req as any).teamId, String(req.params.projectId));
    res.json(services);
  } catch (e) { next(e); }
});

router.post('/projects/:projectId/services', validateRequest({ body: CreateServiceSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await createService((req as any).teamId, {
      ...req.body,
      projectId: String(req.params.projectId),
    });
    res.status(201).json(service);
  } catch (e) { next(e); }
});

router.get('/services/:id', validateRequest({ params: z.object({ id: objectIdSchema }) }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await getService((req as any).teamId, String(req.params.id));
    if (!service) { res.status(404).send('Service not found'); return; }
    res.json(service);
  } catch (e) { next(e); }
});

router.put('/services/:id', validateRequest({ params: z.object({ id: objectIdSchema }), body: CreateServiceSchema.partial() }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await updateService((req as any).teamId, String(req.params.id), req.body);
    if (!service) { res.status(404).send('Service not found'); return; }
    res.json(service);
  } catch (e) { next(e); }
});

router.delete('/services/:id', validateRequest({ params: z.object({ id: objectIdSchema }) }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteService((req as any).teamId, String(req.params.id));
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;