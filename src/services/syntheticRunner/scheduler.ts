import cronParser from 'cron-parser';
import { SyntheticScenario } from '../../models/scenario';

export class Scheduler {
  private runner: any;
  private cronParser: typeof cronParser;
  private hasStartedSchedules = false;

  constructor(runner: any) {
    this.runner = runner;
    this.cronParser = cronParser;
  }

  async startEnabledSchedulesOnStartup(): Promise<void> {
    if (this.hasStartedSchedules) return;

    const scenarios = await SyntheticScenario.find({
      isActive: true,
      'schedule.enabled': true,
    });

    console.log(`[Scheduler] Starting ${scenarios.length} enabled schedules on startup`);

    for (const scenario of scenarios) {
      if (!scenario.schedule?.enabled) continue;

      try {
        console.log(`[Scheduler] Starting scheduled scenario ${scenario._id} (${scenario.name})`);
        await this.runner.runScenario(scenario._id.toString());
      } catch (err) {
        console.error(`[Scheduler] Failed to start scheduled scenario ${scenario._id}:`, err);
      }
    }

    this.hasStartedSchedules = true;
  }

  async checkScheduledScenarios(): Promise<void> {
    const now = new Date();
    const scenarios = await SyntheticScenario.find({
      isActive: true,
      'schedule.enabled': true,
    });

    for (const scenario of scenarios) {
      if (!scenario.schedule?.enabled) continue;

      try {
        if (scenario.schedule.cronExpression) {
          const interval = this.cronParser.parseExpression(scenario.schedule.cronExpression);
          const nextRun = interval.next().toDate();

          if (Math.abs(nextRun.getTime() - now.getTime()) < 1000) {
            console.log(`[Scheduler] Running scheduled scenario ${scenario._id}`);
            await this.runner.runScenario(scenario._id.toString());
          }
        } else if (scenario.schedule.intervalMs) {
          const lastRun = scenario.lastRunAt?.getTime() || 0;
          if (now.getTime() - lastRun >= scenario.schedule.intervalMs) {
            console.log(`[Scheduler] Running interval-based scenario ${scenario._id}`);
            await this.runner.runScenario(scenario._id.toString());
          }
        }
      } catch (err) {
        console.error(`[Scheduler] Scheduled scenario error for ${scenario._id}:`, err);
      }
    }
  }

  async startSchedule(scenarioId: string): Promise<void> {
    await SyntheticScenario.findByIdAndUpdate(scenarioId, { isActive: true });
  }

  async stopSchedule(scenarioId: string): Promise<void> {
    await SyntheticScenario.findByIdAndUpdate(scenarioId, { isActive: false });
  }
}