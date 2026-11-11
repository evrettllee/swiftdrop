import { expect, test } from '@playwright/test';
import { FakeClock } from '@/shared/lib/clock';
import {
  type EventSubscription,
  SOCKET_EVENT_BATCH_DELAY_MS,
  subscribeBatched,
} from './event-batch';

function createEmitter() {
  const listeners = new Set<() => void>();
  const subscription: EventSubscription = (listener) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  return { subscription, emit: () => listeners.forEach((listener) => listener()), listeners };
}

function setup() {
  const clock = new FakeClock(0);
  const orders = createEmitter();
  const tickets = createEmitter();
  let calls = 0;
  const unsubscribe = subscribeBatched(
    [orders.subscription, tickets.subscription],
    () => {
      calls += 1;
    },
    clock,
  );

  return { clock, orders, tickets, unsubscribe, calls: () => calls };
}

test('should call the action once for a batch of events', () => {
  const { clock, orders, tickets, calls } = setup();

  orders.emit();
  clock.advance(100);
  tickets.emit();
  clock.advance(100);
  orders.emit();
  clock.advance(SOCKET_EVENT_BATCH_DELAY_MS - 1);
  expect(calls()).toBe(0);

  clock.advance(1);
  expect(calls()).toBe(1);
});

test('should call the action again for a batch after a quiet time', () => {
  const { clock, orders, calls } = setup();

  orders.emit();
  clock.advance(SOCKET_EVENT_BATCH_DELAY_MS);
  orders.emit();
  orders.emit();
  clock.advance(SOCKET_EVENT_BATCH_DELAY_MS);

  expect(calls()).toBe(2);
});

test('should not call the action without events', () => {
  const { clock, calls } = setup();

  clock.advance(10 * SOCKET_EVENT_BATCH_DELAY_MS);

  expect(calls()).toBe(0);
});

test('should unsubscribe from every event and drop the waiting call', () => {
  const { clock, orders, tickets, unsubscribe, calls } = setup();

  orders.emit();
  unsubscribe();
  clock.advance(SOCKET_EVENT_BATCH_DELAY_MS);
  orders.emit();
  tickets.emit();
  clock.advance(SOCKET_EVENT_BATCH_DELAY_MS);

  expect(calls()).toBe(0);
  expect(orders.listeners.size).toBe(0);
  expect(tickets.listeners.size).toBe(0);
});
