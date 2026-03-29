import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import projectsRouter from './routers/projects';
import servicesRouter from './routers/services';
import scenariosRouter from './routers/scenarios';
import importRouter from './routers/import';
import { SyntheticScenario } from './models/scenario';

import './models/project';
import './models/service';
import './models/scenario';

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/testdx';

app.use(cors());
app.use(express.json());
app.use('/api', projectsRouter);
app.use('/api', servicesRouter);
app.use('/api/scenarios', scenariosRouter);
app.use('/api', importRouter);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

async function cleanupInterruptedScenarios(): Promise<void> {
  try {
    const interruptedScenarios = await SyntheticScenario.find({
      'currentRunProgress.status': 'running',
    });

    if (interruptedScenarios.length > 0) {
      console.log(`[Startup] Found ${interruptedScenarios.length} scenarios with interrupted runs`);
      
      await SyntheticScenario.updateMany(
        { 'currentRunProgress.status': 'running' },
        { 
          $set: { 
            'currentRunProgress.status': 'stopped',
            'currentRunProgress.error': 'Interrupted on application restart'
          }
        }
      );
      
      console.log('[Startup] Marked all interrupted scenarios as stopped');
    }
  } catch (err) {
    console.error('[Startup] Error cleaning up interrupted scenarios:', err);
  }
}

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await cleanupInterruptedScenarios();

    const SyntheticRunner = require('./services/syntheticRunner').default;
    const runner = new SyntheticRunner();

    await runner.startEnabledSchedulesOnStartup();

    setInterval(async () => {
      try {
        await runner.checkScheduledScenarios();
      } catch (e) {
        console.error('Scheduled task error:', e);
      }
    }, 1000);
    console.log('Started synthetic runner task (every second)');

    app.listen(PORT, () => {
      console.log(`TestDX API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();

export default app;