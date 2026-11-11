import { expect, test } from '@playwright/test';
import { keepUnchangedItems } from './keep-unchanged';

type Row = { id: number; status: string; at: Date };

const AT = new Date('2026-11-11T09:00:00Z');

function row(id: number, status = 'confirmed'): Row {
  return { id, status, at: AT };
}

test('should keep the objects of the unchanged rows and take the changed ones', () => {
  const previous = [row(1), row(2), row(3)];
  const next = keepUnchangedItems(
    previous,
    [row(1), row(2, 'in_transit'), row(3)],
    (item) => item.id,
  );

  expect(next[0]).toBe(previous[0]);
  expect(next[1]).not.toBe(previous[1]);
  expect(next[1]?.status).toBe('in_transit');
  expect(next[2]).toBe(previous[2]);
});

test('should give back the same list when nothing changed', () => {
  const previous = [row(1), row(2)];

  expect(keepUnchangedItems(previous, [row(1), row(2)], (item) => item.id)).toBe(previous);
});

test('should take a new order of rows and new rows as they come', () => {
  const previous = [row(1), row(2)];
  const next = keepUnchangedItems(previous, [row(3), row(1)], (item) => item.id);

  expect(next.map((item) => item.id)).toEqual([3, 1]);
  expect(next[1]).toBe(previous[0]);
  expect(next).not.toBe(previous);
});
