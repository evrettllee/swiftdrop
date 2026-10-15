import { CircuitBreaker } from './circuit-breaker';

const THRESHOLD = 3;
const COOLDOWN_MS = 30_000;
const START_MS = 1_000_000;

function failTimes(breaker: CircuitBreaker, times: number, nowMs = START_MS): boolean[] {
  return Array.from({ length: times }, () => breaker.recordFailure(nowMs));
}

describe('CircuitBreaker', () => {
  it('should be closed at the start', () => {
    expect(new CircuitBreaker(THRESHOLD, COOLDOWN_MS).isOpen(START_MS)).toBe(false);
  });

  it('should open on the failure that reaches the threshold', () => {
    const breaker = new CircuitBreaker(THRESHOLD, COOLDOWN_MS);

    expect(failTimes(breaker, THRESHOLD)).toEqual([false, false, true]);
    expect(breaker.isOpen(START_MS)).toBe(true);
  });

  it('should not report opening again for failures while it is open', () => {
    const breaker = new CircuitBreaker(THRESHOLD, COOLDOWN_MS);
    failTimes(breaker, THRESHOLD);

    expect(breaker.recordFailure(START_MS + 1)).toBe(false);
  });

  it('should start the count anew after a success', () => {
    const breaker = new CircuitBreaker(THRESHOLD, COOLDOWN_MS);
    failTimes(breaker, THRESHOLD - 1);

    breaker.recordSuccess();

    expect(failTimes(breaker, THRESHOLD - 1)).toEqual([false, false]);
    expect(breaker.isOpen(START_MS)).toBe(false);
  });

  it('should close when the pause is over', () => {
    const breaker = new CircuitBreaker(THRESHOLD, COOLDOWN_MS);
    failTimes(breaker, THRESHOLD);

    expect(breaker.isOpen(START_MS + COOLDOWN_MS - 1)).toBe(true);
    expect(breaker.isOpen(START_MS + COOLDOWN_MS)).toBe(false);
  });

  it('should open again on a failure after the pause', () => {
    const breaker = new CircuitBreaker(THRESHOLD, COOLDOWN_MS);
    failTimes(breaker, THRESHOLD);
    const afterPauseMs = START_MS + COOLDOWN_MS;

    expect(breaker.recordFailure(afterPauseMs)).toBe(true);
    expect(breaker.isOpen(afterPauseMs + COOLDOWN_MS - 1)).toBe(true);
  });

  it('should report that a success closed the opened breaker only once', () => {
    const breaker = new CircuitBreaker(THRESHOLD, COOLDOWN_MS);
    failTimes(breaker, THRESHOLD);

    expect(breaker.recordSuccess()).toBe(true);
    expect(breaker.recordSuccess()).toBe(false);
    expect(breaker.isOpen(START_MS)).toBe(false);
  });

  it('should need the full threshold again after it closed with a success', () => {
    const breaker = new CircuitBreaker(THRESHOLD, COOLDOWN_MS);
    failTimes(breaker, THRESHOLD);
    breaker.recordSuccess();

    expect(failTimes(breaker, THRESHOLD)).toEqual([false, false, true]);
  });
});
