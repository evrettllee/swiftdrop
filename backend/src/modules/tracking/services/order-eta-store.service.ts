import { Injectable } from '@nestjs/common';
import type { OrderEtaEntry } from '../types/tracking.types';

// The estimates of the orders that are with a courier, in the memory of this process, like the
// cache of the routing lines. An entry leaves once its order is over, so the map stays as small as
// the number of active orders. With several backend instances this moves to a shared store.
@Injectable()
export class OrderEtaStore {
  private readonly entries = new Map<number, OrderEtaEntry>();

  get(orderId: number): OrderEtaEntry | undefined {
    return this.entries.get(orderId);
  }

  // The entry of the order, made empty on the first use.
  ensure(orderId: number): OrderEtaEntry {
    let entry = this.entries.get(orderId);

    if (!entry) {
      entry = { computedAtMs: 0, inFlight: false, forceQueued: false, courierLeg: null };
      this.entries.set(orderId, entry);
    }

    return entry;
  }

  delete(orderId: number): void {
    this.entries.delete(orderId);
  }

  // Forgets everything, as a restart of the server does.
  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}
