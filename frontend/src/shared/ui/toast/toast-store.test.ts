import { expect, test } from '@playwright/test';
import { FakeClock } from '@/shared/lib/clock';
import { createToastStore, TOAST_DURATION_MS, type ToastContent } from './toast-store';

const SECOND = 1000;

function content(key: string, title = key): ToastContent {
  return { key, variant: 'chat', title, text: 'Подъезд со двора, домофон 13' };
}

function setup() {
  const clock = new FakeClock(0);
  const store = createToastStore(clock);

  return { clock, store, title: () => store.getToast()?.title ?? null };
}

test('should show one toast at a time, the new one taking the place of the shown one', () => {
  const { store, title } = setup();

  store.show(content('chat:1', 'Дмитрий С.'));
  store.show(content('chat:1', 'Анна Кравец'));

  expect(title()).toBe('Анна Кравец');
});

test('should hide the toast when its time is up, the new one with its own time', () => {
  const { clock, store, title } = setup();

  store.show(content('first'));
  clock.advance(TOAST_DURATION_MS - SECOND);
  store.show(content('second'));
  clock.advance(TOAST_DURATION_MS - SECOND);
  expect(title()).toBe('second');

  clock.advance(SECOND);
  expect(title()).toBeNull();
});

test('should keep the time it has left while paused and count it after the pause', () => {
  const { clock, store, title } = setup();

  store.show(content('chat:1'));
  clock.advance(2 * SECOND);
  store.pause();
  clock.advance(60 * SECOND);
  expect(title()).toBe('chat:1');

  store.resume();
  clock.advance(TOAST_DURATION_MS - 2 * SECOND - 1);
  expect(title()).toBe('chat:1');
  clock.advance(1);
  expect(title()).toBeNull();
});

test('should take the time of the toast when it gives one', () => {
  const { clock, store, title } = setup();

  store.show({ ...content('offer'), durationMs: 3 * SECOND });
  clock.advance(3 * SECOND);

  expect(title()).toBeNull();
});

test('should hide by the key only the toast with this key', () => {
  const { store, title } = setup();

  store.show(content('offer'));
  store.hide('chat:1');
  expect(title()).toBe('offer');

  store.hide('offer');
  expect(title()).toBeNull();
});

test('should tell the listeners when the toast changes', () => {
  const { clock, store } = setup();
  let changes = 0;
  const unsubscribe = store.subscribe(() => {
    changes += 1;
  });

  store.show(content('chat:1'));
  clock.advance(TOAST_DURATION_MS);
  unsubscribe();
  store.show(content('chat:2'));

  expect(changes).toBe(2);
});
