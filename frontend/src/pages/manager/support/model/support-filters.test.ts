import { expect, test } from '@playwright/test';
import { appliedFilters } from '../lib/applied-filters';
import {
  CLEARED_DRAFT,
  countFilters,
  filterDraftOf,
  filterPatch,
  isFilterDraftValid,
  toggleTopic,
} from './support-filters';

const NOW = new Date('2026-11-06T09:00:00Z');
const NO_FILTERS = { topic: [], from: null, to: null };

test('should keep the topics in the order of the list whatever the order of the clicks', () => {
  expect(toggleTopic(['other'], 'payment')).toEqual(['payment', 'other']);
  expect(toggleTopic(['payment', 'other'], 'payment')).toEqual(['other']);
  expect(toggleTopic([], 'app')).toEqual(['app']);
});

test('should read a period of the address as a preset and turn the draft back into it', () => {
  const week = filterDraftOf({ topic: ['app'], from: '2026-10-31', to: null }, NOW);

  expect(week).toEqual({ preset: 'week', from: '2026-10-31', to: null, topics: ['app'] });
  expect(filterPatch({ ...week, preset: 'month' }, NOW)).toEqual({
    topic: ['app'],
    from: '2026-10-08',
    to: null,
  });
  expect(filterPatch(CLEARED_DRAFT, NOW)).toEqual(NO_FILTERS);
});

test('should refuse a custom period that ends before it starts', () => {
  expect(
    isFilterDraftValid({
      ...CLEARED_DRAFT,
      preset: 'custom',
      from: '2026-11-05',
      to: '2026-11-01',
    }),
  ).toBe(false);
  expect(
    isFilterDraftValid({ ...CLEARED_DRAFT, preset: 'custom', from: '2026-11-01', to: null }),
  ).toBe(true);
});

test('should count the topics and the period as two filters', () => {
  expect(countFilters(NO_FILTERS)).toBe(0);
  expect(countFilters({ topic: ['payment', 'app'], from: '2026-11-01', to: null })).toBe(2);
  expect(countFilters({ topic: [], from: '2026-11-05', to: '2026-11-01' })).toBe(0);
});

test('should name the chips of the topics and the period with their reset', () => {
  const chips = appliedFilters(
    { topic: ['client_unreachable', 'other'], from: '2026-11-01', to: '2026-11-05' },
    NOW,
  );

  expect(chips.map((chip) => `${chip.name}: ${chip.value}`)).toEqual([
    'Тема: клиент не выходит на связь, другое',
    'Создано: 01.11–05.11',
  ]);
  expect(chips.map((chip) => chip.reset)).toEqual([{ topic: [] }, { from: null, to: null }]);
  expect(appliedFilters({ topic: [], from: '2026-10-31', to: null }, NOW)[0]?.value).toBe('7 дней');
});
