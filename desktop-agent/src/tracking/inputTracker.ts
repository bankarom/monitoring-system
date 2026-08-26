import { powerMonitor } from 'electron';

export class InputTracker {
  private clicksCount = 0;
  private keystrokesCount = 0;
  private lastIdleCheck = Date.now();
  private isCurrentlyIdle = false;
  private idleThresholdSeconds = 300; // 5 minutes default

  constructor(idleThresholdMinutes = 5) {
    this.idleThresholdSeconds = idleThresholdMinutes * 60;
  }

  public setIdleThreshold(minutes: number) {
    this.idleThresholdSeconds = minutes * 60;
  }

  public recordMouseClick() {
    this.clicksCount++;
  }

  public recordKeystroke() {
    this.keystrokesCount++;
  }

  public checkIdleState(): boolean {
    const idleSeconds = powerMonitor.getSystemIdleTime();
    this.isCurrentlyIdle = idleSeconds >= this.idleThresholdSeconds;
    return this.isCurrentlyIdle;
  }

  public getAndResetMetrics(sampleDurationSeconds = 30) {
    const isIdle = this.checkIdleState();
    const clicks = this.clicksCount;
    const keys = this.keystrokesCount;

    // Reset counters for next sample window
    this.clicksCount = 0;
    this.keystrokesCount = 0;

    const clicksPerMinute = Math.round((clicks / sampleDurationSeconds) * 60);
    const keysPerMinute = Math.round((keys / sampleDurationSeconds) * 60);

    return {
      clicks,
      keystrokes: keys,
      clicksPerMinute,
      keysPerMinute,
      isIdle
    };
  }
}