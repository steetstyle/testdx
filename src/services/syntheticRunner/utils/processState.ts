export class ProcessState {
  private processes: Map<string, boolean>;
  private cancelledScenarios: Set<string>;

  constructor() {
    this.processes = new Map();
    this.cancelledScenarios = new Set();
  }

  isRunning(scenarioId: string): boolean {
    return this.processes.get(scenarioId) || false;
  }

  markRunning(scenarioId: string): void {
    this.processes.set(scenarioId, true);
  }

  markStopped(scenarioId: string): void {
    this.processes.set(scenarioId, false);
  }

  getStatus(scenarioId: string): boolean | undefined {
    return this.processes.get(scenarioId);
  }

  setRunningForTesting(scenarioId: string): void {
    this.processes.set(scenarioId, true);
  }

  clear(): void {
    this.processes.clear();
  }

  isCancelled(scenarioId: string): boolean {
    return this.cancelledScenarios.has(scenarioId);
  }

  cancel(scenarioId: string): void {
    this.cancelledScenarios.add(scenarioId);
  }

  clearCancellation(scenarioId: string): void {
    this.cancelledScenarios.delete(scenarioId);
  }
}