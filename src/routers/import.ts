import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from 'zod-express-middleware';
import { mockAuth } from './schemas/base';
import { importFromFullYaml } from '../controllers/import';

const router = express.Router();

router.use(mockAuth);

router.post('/import/full', validateRequest({ body: z.object({ yaml: z.string().min(1) }) }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[Import] Starting full YAML import...');
    console.log('[Import] YAML content length:', req.body.yaml?.length);
    const result = await importFromFullYaml((req as any).teamId, req.body.yaml);
    console.log('[Import] Success:', result);
    res.status(201).json(result);
  } catch (e: any) {
    console.error('[Import] Error:', e.message);
    console.error('[Import] Stack:', e.stack);

    const errorResponse: any = {
      error: e.message,
      name: e.name
    };

    if (e.name === 'ValidationError' && e.errors) {
      errorResponse.errors = {};
      for (const [key, val] of Object.entries(e.errors as Record<string, any>)) {
        errorResponse.errors[key] = {
          message: val.message,
          kind: val.kind,
          path: val.path
        };
      }
    } else if (e.name === 'MongoServerError') {
      errorResponse.code = e.code;
      errorResponse.keyPattern = e.keyPattern;
      errorResponse.keyValue = e.keyValue;
    }

    res.status(500).json(errorResponse);
  }
});

router.get('/import/files', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const scenariosDir = path.join(process.cwd(), 'scenarios');

    if (!fs.existsSync(scenariosDir)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(scenariosDir)
      .filter((f: string) => f.endsWith('.yaml') || f.endsWith('.yml'))
      .map((f: string) => ({
        name: f,
        path: path.join(scenariosDir, f),
        size: fs.statSync(path.join(scenariosDir, f)).size
      }));

    res.json({ files });
  } catch (e: any) {
    console.error('[ListFiles] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post('/import/file', validateRequest({ body: z.object({ filename: z.string().min(1) }) }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const filename = req.body.filename;
    const filePath = path.join(process.cwd(), 'scenarios', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `File not found: ${filename}` });
    }

    const yamlContent = fs.readFileSync(filePath, 'utf8');
    console.log('[ImportFile] Loading:', filePath);

    const result = await importFromFullYaml((req as any).teamId, yamlContent);
    res.status(201).json(result);
  } catch (e: any) {
    console.error('[ImportFile] Error:', e.message);
    console.error('[ImportFile] Stack:', e.stack);

    const errorResponse: any = {
      error: e.message,
      name: e.name
    };

    if (e.name === 'ValidationError' && e.errors) {
      errorResponse.errors = {};
      for (const [key, val] of Object.entries(e.errors as Record<string, any>)) {
        errorResponse.errors[key] = {
          message: val.message,
          kind: val.kind,
          path: val.path
        };
      }
    }

    res.status(500).json(errorResponse);
  }
});

export default router;