import { SyntheticScenario } from '../../../models/scenario';
import { RunResult, RunProgress } from './types';

export function createErrorResult(
  error: unknown,
  initialProgress: RunProgress
): RunResult {
  const errorMsg = getErrorMessage(error);
  return {
    success: false,
    recordsGenerated: 0,
    tracesGenerated: 0,
    metricsGenerated: 0,
    logsGenerated: 0,
    error: errorMsg,
  };
}

export function createErrorProgress(
  error: unknown,
  initialProgress: RunProgress
): RunProgress {
  const errorMsg = getErrorMessage(error);
  return {
    ...initialProgress,
    status: 'failed',
    error: errorMsg,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

export async function handleRunnerError(
  scenarioId: string,
  error: unknown,
  initialProgress: RunProgress
): Promise<RunResult> {
  const errorResult = createErrorResult(error, initialProgress);
  const errorProgress = createErrorProgress(error, initialProgress);

  await SyntheticScenario.findByIdAndUpdate(scenarioId, {
    currentRunProgress: errorProgress,
  });

  return errorResult;
}