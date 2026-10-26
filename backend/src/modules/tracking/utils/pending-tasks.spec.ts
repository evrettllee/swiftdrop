import { PendingTasks } from './pending-tasks';

function deferred(): { promise: Promise<void>; finish: () => void } {
  let finish: () => void = () => undefined;
  const promise = new Promise<void>((resolve) => (finish = resolve));

  return { promise, finish };
}

describe('PendingTasks', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be idle at once with nothing running', async () => {
    await expect(new PendingTasks().waitForIdle(1)).resolves.toBe(true);
  });

  it('should wait for a task and the one it started while waiting', async () => {
    const tasks = new PendingTasks();
    const first = deferred();
    const second = deferred();
    void tasks.track(first.promise.then(() => void tasks.track(second.promise)));

    const idle = tasks.waitForIdle(60_000);
    first.finish();
    await new Promise(setImmediate);
    expect(tasks.size).toBe(1);
    second.finish();

    await expect(idle).resolves.toBe(true);
    expect(tasks.size).toBe(0);
  });

  it('should give up once the time is up', async () => {
    jest.useFakeTimers();
    const tasks = new PendingTasks();
    void tasks.track(deferred().promise);

    const idle = tasks.waitForIdle(5_000);
    jest.advanceTimersByTime(5_000);

    await expect(idle).resolves.toBe(false);
    expect(tasks.size).toBe(1);
  });
});
