import { SyntheticScenario } from '../../../models/scenario';
import { RunProgress, RunHistoryEntry } from './types';

export async function updateProgress(
  scenarioId: string,
  progress: Partial<RunProgress>
): Promise<void> {
  await SyntheticScenario.findByIdAndUpdate(scenarioId, {
    currentRunProgress: progress,
  });
}

export async function updateWithResult(
  scenarioId: string,
  runEntry: RunHistoryEntry,
  finalProgress: Partial<RunProgress>
): Promise<void> {
  await SyntheticScenario.findByIdAndUpdate(scenarioId, {
    lastRunAt: new Date(),
    lastRunStatus: runEntry.status,
    $push: { recentRuns: { $each: [runEntry], $slice: -20 } },
    currentRunProgress: finalProgress,
  });
}