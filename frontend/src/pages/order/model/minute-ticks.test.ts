import { expect, test } from '@playwright/test';
import { FakeClock } from '@/shared/lib/clock';
import { minutesUntil } from '../lib/minutes';
import { startMinuteTicks } from './minute-ticks';

const START_MS = Date.parse('2026-10-24T12:00:00Z');
const PICKUP_MS = START_MS + 7 * 60_000 + 30_000;

test('should count the minutes down each time a whole minute passes to the target', () => {
  const clock = new FakeClock(START_MS);
  const shown: number[] = [minutesUntil(PICKUP_MS, clock.now())];
  const stop = startMinuteTicks(clock, PICKUP_MS, (nowMs) =>
    shown.push(minutesUntil(PICKUP_MS, nowMs)),
  );

  clock.advance(29_999);
  expect(shown).toEqual([8]);
  clock.advance(1);
  expect(shown).toEqual([8, 7]);
  clock.advance(60_000);
  expect(shown).toEqual([8, 7, 6]);
  clock.advance(6 * 60_000);
  expect(shown).toEqual([8, 7, 6, 5, 4, 3, 2, 1, 1]);

  stop();
  clock.advance(5 * 60_000);
  expect(shown).toHaveLength(9);
});

test('should keep one minute at least once the target has passed', () => {
  expect(minutesUntil(PICKUP_MS, PICKUP_MS)).toBe(1);
  expect(minutesUntil(PICKUP_MS, PICKUP_MS + 5 * 60_000)).toBe(1);
});
