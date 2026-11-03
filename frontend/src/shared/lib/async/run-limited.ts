export type LimitedTask<T> = (signal: AbortSignal) => Promise<T>;

export type TaskResult<T> = { ok: true; value: T } | { ok: false };

export async function runLimited<T>(
  tasks: readonly LimitedTask<T>[],
  limit: number,
  signal: AbortSignal,
  onResult: (index: number, result: TaskResult<T>) => void,
): Promise<void> {
  let next = 0;

  async function worker(): Promise<void> {
    while (next < tasks.length && !signal.aborted) {
      const index = next;
      next += 1;

      try {
        const value = await tasks[index](signal);

        if (!signal.aborted) {
          onResult(index, { ok: true, value });
        }
      } catch {
        if (!signal.aborted) {
          onResult(index, { ok: false });
        }
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
}
