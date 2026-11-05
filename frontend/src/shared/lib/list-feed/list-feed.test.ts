import { expect, test } from '@playwright/test';
import { LIST_STATUS } from '@/shared/config';
import { appendFeed, failFeed, feedView, startFeed } from './list-feed';

function buildOrderListItem(orderId: number) {
  return { orderId };
}

const FIRST = { items: [buildOrderListItem(3), buildOrderListItem(2)], nextCursor: 'c1', total: 3 };
const NEXT = { items: [buildOrderListItem(1)], nextCursor: null };

test('should show the first page with the total of the whole list', () => {
  const view = feedView(startFeed<{ orderId: number }, typeof FIRST>('a', FIRST), 'a');

  expect(view.status).toBe(LIST_STATUS.READY);
  expect(view.items.map((item) => item.orderId)).toEqual([3, 2]);
  expect(view.total).toBe(3);
  expect(view.hasMore).toBe(true);
});

test('should add the next page to the end and keep the total of the first one', () => {
  const view = feedView(
    appendFeed(startFeed<{ orderId: number }, typeof FIRST>('a', FIRST), 'a', NEXT),
    'a',
  );

  expect(view.items.map((item) => item.orderId)).toEqual([3, 2, 1]);
  expect(view.total).toBe(3);
  expect(view.hasMore).toBe(false);
});

test('should start over when the filters change', () => {
  const loaded = appendFeed(startFeed<{ orderId: number }, typeof FIRST>('a', FIRST), 'a', NEXT);
  const view = feedView(loaded, 'b');

  expect(view.status).toBe(LIST_STATUS.LOADING);
  expect(view.items).toEqual([]);
  expect(view.total).toBe(0);
  expect(view.hasMore).toBe(false);
});

test('should not add a late page of the old filters to the new list', () => {
  const current = startFeed('b', { items: [buildOrderListItem(9)], nextCursor: null, total: 1 });

  expect(appendFeed(current, 'a', NEXT)).toBe(current);
});

test('should keep the loaded orders when the next page fails', () => {
  const view = feedView(
    failFeed(startFeed<{ orderId: number }, typeof FIRST>('a', FIRST), 'a', 'Нет сети'),
    'a',
  );

  expect(view.status).toBe(LIST_STATUS.ERROR);
  expect(view.items).toHaveLength(2);
  expect(view.message).toBe('Нет сети');
  expect(view.hasMore).toBe(true);
});

test('should count the orders of a page without the total', () => {
  const view = feedView(startFeed('a', { items: [buildOrderListItem(1)], nextCursor: null }), 'a');

  expect(view.total).toBe(1);
});
