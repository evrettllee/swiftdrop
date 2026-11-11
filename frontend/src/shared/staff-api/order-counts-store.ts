import { useEffect, useSyncExternalStore } from 'react';
import type { ManagerOrderCounts } from './manager-orders';

export const ORDER_COUNTS_FRESH_MS = 30_000;

type StoredCounts = { counts: ManagerOrderCounts; savedAt: number };

let stored: StoredCounts | null = null;
let owners = 0;
let pending: Promise<ManagerOrderCounts> | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function rememberOrderCounts(counts: ManagerOrderCounts, savedAt = Date.now()): void {
  stored = { counts, savedAt };
  notify();
}

export function shareOrderCounts(
  load: () => Promise<ManagerOrderCounts>,
): Promise<ManagerOrderCounts> {
  pending ??= load()
    .then((counts) => {
      rememberOrderCounts(counts);

      return counts;
    })
    .finally(() => {
      pending = null;
    });

  return pending;
}

export function storedOrderCounts(): StoredCounts | null {
  return stored;
}

export function areOrderCountsFresh(now = Date.now()): boolean {
  return stored !== null && now - stored.savedAt < ORDER_COUNTS_FRESH_MS;
}

export function hasOrderCountsOwner(): boolean {
  return owners > 0;
}

export function claimOrderCounts(): () => void {
  owners += 1;
  let isReleased = false;

  return () => {
    if (!isReleased) {
      isReleased = true;
      owners -= 1;
    }
  };
}

export function forgetOrderCounts(): void {
  stored = null;
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function useStoredOrderCounts(): ManagerOrderCounts | null {
  return useSyncExternalStore(subscribe, () => stored?.counts ?? null);
}

export function useOrderCountsOwner(isOwner: boolean): void {
  useEffect(() => (isOwner ? claimOrderCounts() : undefined), [isOwner]);
}
