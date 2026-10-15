// Stops calls to a dependency that keeps failing: after `threshold` failures in a row it opens for
// `cooldownMs`, so callers fail at once instead of waiting for timeouts. After the pause one call
// goes through as a trial: a success closes the breaker, a failure opens it again at once. The time
// is passed in, so the breaker is tested without timers.
export class CircuitBreaker {
  private failuresInRow = 0;
  private isTripped = false;
  private openUntilMs = 0;

  constructor(
    private readonly threshold: number,
    private readonly cooldownMs: number,
  ) {}

  isOpen(nowMs: number): boolean {
    return this.isTripped && nowMs < this.openUntilMs;
  }

  // Returns whether this success closed a breaker that had opened: the dependency is back.
  recordSuccess(): boolean {
    const wasTripped = this.isTripped;

    this.failuresInRow = 0;
    this.isTripped = false;

    return wasTripped;
  }

  // Returns whether this failure opened the breaker. A call that started before the breaker opened
  // and fails while it is open does not extend the pause.
  recordFailure(nowMs: number): boolean {
    this.failuresInRow += 1;

    const opens = this.failuresInRow >= this.threshold && !this.isOpen(nowMs);

    if (opens) {
      this.isTripped = true;
      this.openUntilMs = nowMs + this.cooldownMs;
    }

    return opens;
  }
}
