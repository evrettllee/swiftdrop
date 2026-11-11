import { expect, test } from '@playwright/test';
import { HISTORY_PARAMS_CONFIG, type HistoryParams } from '../config/list-params';
import { appliedFilters } from './applied-filters';
import { draftOf, draftParams } from './history-period';

function params(patch: Partial<HistoryParams> = {}): HistoryParams {
  return { ...HISTORY_PARAMS_CONFIG.defaults, ...patch };
}

test('should name the status chip and reset it to every status', () => {
  const chips = appliedFilters(params({ status: 'cancelled' }));

  expect(chips.map((chip) => `${chip.name}: ${chip.value}`)).toEqual(['Статус: отменённые']);
  expect(chips[0]?.reset).toEqual({ status: null });
  expect(appliedFilters(params())).toEqual([]);
});

test('should carry the status through the draft of the panel', () => {
  const value = { period: 'all', from: null, to: null, status: 'delivered' } as const;

  expect(draftParams(draftOf(value))).toEqual(value);
  expect(draftParams({ ...draftOf(value), status: null })).toEqual({ ...value, status: null });
});
