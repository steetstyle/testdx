export class RateLimiter {
  private hourlyRunCounts: Map<string, number>;
  private intervalId: NodeJS.Timeout | null;

  constructor() {
    this.hourlyRunCounts = new Map();
    this.intervalId = null;
    this.startHourlyReset();
  }

  private startHourlyReset(): void {
    this.intervalId = setInterval(() => {
      this.hourlyRunCounts.clear();
    }, 60 * 60 * 1000);
  }

  checkLimit(scenarioId: string, maxPerHour: number): boolean {
    const hourlyKey = `${scenarioId}-${new Date().getHours()}`;
    const currentCount = this.hourlyRunCounts.get(hourlyKey) || 0;
    return currentCount >= maxPerHour;
  }

  increment(scenarioId: string): void {
    const hourlyKey = `${scenarioId}-${new Date().getHours()}`;
    const currentCount = this.hourlyRunCounts.get(hourlyKey) || 0;
    this.hourlyRunCounts.set(hourlyKey, currentCount + 1);
  }

  reset(): void {
    this.hourlyRunCounts.clear();
  }

  getHourlyKey(scenarioId: string): string {
    return `${scenarioId}-${new Date().getHours()}`;
  }

  getCurrentCount(scenarioId: string): number {
    const hourlyKey = this.getHourlyKey(scenarioId);
    return this.hourlyRunCounts.get(hourlyKey) || 0;
  }

  setCountForTesting(scenarioId: string, count: number): void {
    const hourlyKey = this.getHourlyKey(scenarioId);
    this.hourlyRunCounts.set(hourlyKey, count);
  }

  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}