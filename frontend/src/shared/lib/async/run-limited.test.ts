import { expect, test } from '@playwright/test';
import { runLimited } from './run-limited';

type Deferred = { resolve: (value: number) => void; reject: () => void };

function setup(count: number) {
  const pending: Deferred[] = [];
  let inFlight = 0;
  let maxInFlight = 0;
  const tasks = Array.from({ length: count }, (_, index) => () => {
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);

    return new Promise<number>((resolve, reject) => {
      pending[index] = {
        resolve: (value) => {
          inFlight -= 1;
          resolve(value);
        },
        reject: () => {
          inFlight -= 1;
          reject(new Error('failed'));
        },
      };
    });
  });

  return { tasks, pending, maxInFlight: () => maxInFlight, started: () => pending.length };
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test('should run at most the limit of tasks at once and every task in the end', async () => {
  const { tasks, pending, maxInFlight, started } = setup(7);
  const results: [number, boolean][] = [];
  const done = runLimited(tasks, 4, new AbortController().signal, (index, result) =>
    results.push([index, result.ok]),
  );

  await flush();
  expect(started()).toBe(4);
  pending[1].resolve(1);
  pending[2].reject();
  await flush();
  expect(started()).toBe(6);

  for (const index of [0, 3, 4, 5]) {
    pending[index].resolve(index);
  }

  await flush();
  pending[6].resolve(6);
  await done;

  expect(maxInFlight()).toBe(4);
  expect([...results].sort(([left], [right]) => left - right)).toEqual([
    [0, true],
    [1, true],
    [2, false],
    [3, true],
    [4, true],
    [5, true],
    [6, true],
  ]);
});

test('should start nothing more and report nothing after the abort', async () => {
  const { tasks, pending, started } = setup(6);
  const controller = new AbortController();
  const results: number[] = [];
  const done = runLimited(tasks, 2, controller.signal, (index) => results.push(index));

  await flush();
  controller.abort();
  pending[0].resolve(0);
  pending[1].resolve(1);
  await done;

  expect(started()).toBe(2);
  expect(results).toEqual([]);
});
