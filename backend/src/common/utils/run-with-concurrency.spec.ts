import { runWithConcurrency } from './run-with-concurrency';

// Resolves on the next turn of the event loop, so lanes really interleave.
function nextTick(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('runWithConcurrency', () => {
  it('should run every item once', async () => {
    const seen: number[] = [];

    await runWithConcurrency([1, 2, 3, 4, 5], 2, async (item) => {
      await nextTick();
      seen.push(item);
    });

    expect([...seen].sort((first, second) => first - second)).toEqual([1, 2, 3, 4, 5]);
  });

  it('should never run more items at once than the limit', async () => {
    let running = 0;
    let maxRunning = 0;

    await runWithConcurrency([1, 2, 3, 4, 5, 6, 7], 3, async () => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      await nextTick();
      running -= 1;
    });

    expect(maxRunning).toBe(3);
  });

  it('should start the items in their order', async () => {
    const started: number[] = [];

    await runWithConcurrency([1, 2, 3, 4], 2, async (item) => {
      started.push(item);
      await nextTick();
    });

    expect(started).toEqual([1, 2, 3, 4]);
  });

  it('should do nothing for no items', async () => {
    const worker = jest.fn();

    await runWithConcurrency([], 5, worker);

    expect(worker).not.toHaveBeenCalled();
  });
});
