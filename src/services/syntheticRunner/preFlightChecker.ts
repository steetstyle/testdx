import { SyntheticScenario } from '../../models/scenario';
import { RateLimiter } from './utils/rateLimiter';
import { ProcessState } from './utils/processState';

export interface PreFlightResult {
  valid: boolean;
  scenario?: any;
  error?: string;
}

export async function checkPreFlight(
  scenarioId: string,
  processState: ProcessState,
  rateLimiter: RateLimiter
): Promise<PreFlightResult> {
  const scenario = await SyntheticScenario.findById(scenarioId);
  
  if (!scenario) {
    return {
      valid: false,
      error: 'Scenario not found',
    };
  }

  if (processState.isRunning(scenarioId)) {
    return {
      valid: false,
      error: 'Scenario already running',
    };
  }

  if (scenario.limits && rateLimiter.checkLimit(scenarioId, scenario.limits.maxPerHour)) {
    return {
      valid: false,
      error: `Hourly run limit (${scenario.limits.maxPerHour}) exceeded`,
    };
  }

  return {
    valid: true,
    scenario,
  };
}
