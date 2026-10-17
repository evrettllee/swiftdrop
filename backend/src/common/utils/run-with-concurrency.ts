// Runs the worker for every item with at most `limit` running at once; items start in their order.
// The worker handles its own errors: one that throws rejects the whole run.
export async function runWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;

  // Each lane takes the next item as soon as its previous one is done.
  const runLane = async (): Promise<void> => {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      await worker(item);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runLane));
}
