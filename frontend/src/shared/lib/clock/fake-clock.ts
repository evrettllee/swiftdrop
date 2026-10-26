import type { Clock } from './clock';

type FakeTimer = { atMs: number; callback: () => void };

export class FakeClock implements Clock {
  private nowMs: number;
  private nextId = 1;
  private readonly timers = new Map<number, FakeTimer>();

  constructor(startMs: number) {
    this.nowMs = startMs;
  }

  now = (): number => this.nowMs;

  setTimeout = (callback: () => void, delayMs: number): number => {
    const id = this.nextId;
    this.nextId += 1;
    this.timers.set(id, { atMs: this.nowMs + delayMs, callback });

    return id;
  };

  clearTimeout = (timer: number): void => {
    this.timers.delete(timer);
  };

  advance(ms: number): void {
    const targetMs = this.nowMs + ms;
    let next = this.nextDue(targetMs);

    while (next !== null) {
      const [id, timer] = next;
      this.timers.delete(id);
      this.nowMs = timer.atMs;
      timer.callback();
      next = this.nextDue(targetMs);
    }

    this.nowMs = targetMs;
  }

  private nextDue(targetMs: number): [number, FakeTimer] | null {
    let due: [number, FakeTimer] | null = null;

    for (const entry of this.timers) {
      if (entry[1].atMs <= targetMs && (due === null || entry[1].atMs < due[1].atMs)) {
        due = entry;
      }
    }

    return due;
  }
}
