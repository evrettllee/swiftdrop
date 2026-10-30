import type { Database, Transaction } from '@/database/database.module';

export type RecordedCall = { method: string; args: unknown[] };

export type QueueDatabase = {
  db: Database;
  tx: Transaction;
  calls: RecordedCall[];
  consumed: () => number;
};

export function queueDatabase(results: readonly unknown[][]): QueueDatabase {
  const calls: RecordedCall[] = [];
  let next = 0;
  const chain: object = new Proxy(
    {},
    {
      get(_target, property) {
        if (property === 'then') {
          const result = results[next] ?? [];
          next += 1;

          return (resolve: (value: unknown) => void) => resolve(result);
        }

        return (...args: unknown[]) => {
          calls.push({ method: String(property), args });

          return chain;
        };
      },
    },
  );

  return {
    db: chain as Database,
    tx: chain as Transaction,
    calls,
    consumed: () => next,
  };
}
