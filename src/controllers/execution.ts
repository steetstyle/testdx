import { SyntheticScenario } from '../models/scenario';

export async function runScenario(teamId: string, id: string, mode: 'realtime' | 'historical', duration?: number, timeRange?: { start: Date; end: Date }): Promise<any> {
  const SyntheticRunner = require('../services/syntheticRunner').default;
  const runner = new SyntheticRunner();
  return runner.runScenario(id, mode, timeRange, duration);
}

export async function startSchedule(teamId: string, id: string): Promise<any | null> {
  return SyntheticScenario.findOneAndUpdate({ teamId, _id: id }, { $set: { 'schedule.enabled': true, isActive: true } }, { new: true });
}

export async function stopSchedule(teamId: string, id: string): Promise<any | null> {
  return SyntheticScenario.findOneAndUpdate({ teamId, _id: id }, { $set: { 'schedule.enabled': false, isActive: false } }, { new: true });
}

export async function stopScenario(teamId: string, id: string): Promise<{ success: boolean; error?: string }> {
  const scenario = await SyntheticScenario.findOne({ teamId, _id: id }).lean();
  
  if (!scenario) {
    return { success: false, error: 'Scenario not found' };
  }
  
  const isRunningInDb = scenario.currentRunProgress?.status === 'running';
  
  if (!isRunningInDb) {
    return { success: false, error: 'Scenario is not running' };
  }
  
  const SyntheticRunner = require('../services/syntheticRunner').default;
  const runner = SyntheticRunner.getInstance();
  
  runner.markRunningForStop(id);
  const stopped = await runner.stopScenario(id);
  
  if (stopped) {
    await SyntheticScenario.findByIdAndUpdate(id, {
      'currentRunProgress.status': 'stopped',
    });
  }
  
  return { success: true };
}

export async function getScenarioHistory(teamId: string, id: string): Promise<any[]> {
  const scenario = await SyntheticScenario.findOne({ teamId, _id: id }).lean();
  return scenario?.recentRuns || [];
}

export async function getScenarioProgress(teamId: string, id: string): Promise<any | null> {
  const scenario = await SyntheticScenario.findOne({ teamId, _id: id }).lean();
  return scenario?.currentRunProgress || null;
}