import { expect, test } from '@playwright/test';
import { listParamsKey, readListParams, untilForKey, writeListParams } from './list-params';
import { LIST_TEST_CONFIG as CONFIG, params } from './list-params-fixture';

test('should leave the default values out of the address', () => {
  const query = writeListParams(
    params('chat=1'),
    { status: 'all', page: 1, limit: 20, q: null, payment: [], fragile: false },
    CONFIG,
  );

  expect(query.toString()).toBe('chat=1');
  expect(
    writeListParams(
      params(''),
      {
        status: 'active',
        page: 3,
        limit: 50,
        q: 'Лис',
        payment: ['paid', 'unpaid'],
        fragile: true,
      },
      CONFIG,
    ).toString(),
  ).toBe('status=active&page=3&limit=50&q=%D0%9B%D0%B8%D1%81&payment=paid%2Cunpaid&fragile=true');
});

test('should replace each broken parameter with its default and keep the valid ones', () => {
  expect(
    readListParams(
      params('status=lost&page=-2&limit=33&q=&payment=paid,cash&fragile=yes&extra=1'),
      CONFIG,
    ),
  ).toEqual(CONFIG.defaults);
  expect(readListParams(params('status=active&page=x&payment=unpaid'), CONFIG)).toEqual({
    ...CONFIG.defaults,
    status: 'active',
    payment: ['unpaid'],
  });
});

test('should keep the bound of the list out of the address and drop it for another list', () => {
  const first = { ...CONFIG.defaults, status: 'active' as const };
  const secondPage = { ...first, page: 2 };
  const otherSort = { ...first, limit: 50 };
  const state = { key: listParamsKey(first, CONFIG), until: 48236 };

  expect(writeListParams(params(''), first, CONFIG).has('until')).toBe(false);
  expect(untilForKey(state, listParamsKey(secondPage, CONFIG))).toBe(48236);
  expect(untilForKey(state, listParamsKey(otherSort, CONFIG))).toBeNull();
  expect(untilForKey(null, listParamsKey(first, CONFIG))).toBeNull();
});
