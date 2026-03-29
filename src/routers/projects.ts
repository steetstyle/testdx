import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from 'zod-express-middleware';
import { objectIdSchema, mockAuth } from './schemas/base';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projects';

const router = express.Router();

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  otelCollectorEndpoint: z.string().default('http://localhost:4318'),
  projectVariables: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number()), z.record(z.unknown())])).optional(),
});

router.use(mockAuth);

router.get('/projects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await getProjects((req as any).teamId);
    res.json(projects);
  } catch (e) { next(e); }
});

router.post('/projects', validateRequest({ body: CreateProjectSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await createProject((req as any).teamId, req.body);
    res.status(201).json(project);
  } catch (e) { next(e); }
});

router.get('/projects/:id', validateRequest({ params: z.object({ id: objectIdSchema }) }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await getProject((req as any).teamId, String(req.params.id));
    if (!project) { res.status(404).send('Project not found'); return; }
    res.json(project);
  } catch (e) { next(e); }
});

router.put('/projects/:id', validateRequest({ params: z.object({ id: objectIdSchema }), body: CreateProjectSchema.partial() }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await updateProject((req as any).teamId, String(req.params.id), req.body);
    if (!project) { res.status(404).send('Project not found'); return; }
    res.json(project);
  } catch (e) { next(e); }
});

router.delete('/projects/:id', validateRequest({ params: z.object({ id: objectIdSchema }) }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteProject((req as any).teamId, String(req.params.id));
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;