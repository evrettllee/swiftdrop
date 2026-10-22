// Work started in the background and not awaited by anyone, kept so a shutdown or a test can wait
// for it to finish before the database goes away.
export class PendingTasks {
  private readonly running = new Set<Promise<void>>();

  get size(): number {
    return this.running.size;
  }

  track(task: Promise<void>): Promise<void> {
    const tracked = task.finally(() => this.running.delete(tracked));
    this.running.add(tracked);

    return tracked;
  }

  // True once nothing runs, false when the time is up first. Work started while waiting is waited
  // for too.
  async waitForIdle(timeoutMs: number): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<false>((resolve) => {
      timer = setTimeout(() => resolve(false), timeoutMs);
      timer.unref();
    });
    const idle = this.drain();
    const result = await Promise.race([idle, timeout]);
    clearTimeout(timer);

    return result;
  }

  private async drain(): Promise<true> {
    while (this.running.size > 0) {
      await Promise.allSettled(this.running);
    }

    return true;
  }
}
