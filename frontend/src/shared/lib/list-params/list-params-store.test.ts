import { expect, test } from '@playwright/test';
import { FakeClock } from '@/shared/lib/clock';
import { readListParams } from './list-params';
import {
  createListParamsStore,
  LIST_HISTORY_MODE,
  type ListHistoryMode,
  LIST_SEARCH_DEBOUNCE_MS,
} from './list-params-store';
import { LIST_TEST_CONFIG as CONFIG, params } from './list-params-fixture';

type Entry = { query: string; mode: ListHistoryMode };

function setup(initial = '') {
  const clock = new FakeClock(0);
  const history: Entry[] = [{ query: initial, mode: LIST_HISTORY_MODE.PUSH }];
  const store = createListParamsStore(
    CONFIG,
    {
      write: (next, mode) => {
        const current = history.at(-1)?.query ?? '';
        const entry = { query: next(params(current)).toString(), mode };

        if (mode === LIST_HISTORY_MODE.REPLACE) {
          history[history.length - 1] = entry;
        } else {
          history.push(entry);
        }
      },
    },
    clock,
  );

  return { clock, history, store, current: () => history.at(-1)?.query ?? '' };
}

test('should add an entry to the history and go to the first page on a change of a filter', () => {
  const { store, history, current } = setup('page=4&limit=50');

  store.update({ status: 'active' });

  expect(current()).toBe('status=active&limit=50');
  expect(history.map((entry) => entry.mode)).toEqual([
    LIST_HISTORY_MODE.PUSH,
    LIST_HISTORY_MODE.PUSH,
  ]);
});

test('should keep the page when the page itself changes', () => {
  const { store, current } = setup('status=active');

  store.update({ page: 2 });

  expect(current()).toBe('status=active&page=2');
});

test('should write the search once after the pause, in place of the current entry', () => {
  const { clock, store, history, current } = setup('status=active&page=3');

  store.typeSearch('Л');
  clock.advance(100);
  store.typeSearch('Ли');
  clock.advance(100);
  store.typeSearch('Лис ');
  clock.advance(LIST_SEARCH_DEBOUNCE_MS - 1);
  expect(current()).toBe('status=active&page=3');

  clock.advance(1);
  expect(readListParams(params(current()), CONFIG)).toMatchObject({ q: 'Лис', page: 1 });
  expect(history).toHaveLength(1);
  expect(history[0].mode).toBe(LIST_HISTORY_MODE.REPLACE);
});

test('should drop the search from the address when the field is cleared', () => {
  const { clock, store, current } = setup('q=48231');

  store.typeSearch('  ');
  clock.advance(LIST_SEARCH_DEBOUNCE_MS);

  expect(current()).toBe('');
});

test('should take the typed search with a change made before the pause ends', () => {
  const { clock, store, history, current } = setup('');

  store.typeSearch('48231');
  store.update({ status: 'active' });
  clock.advance(LIST_SEARCH_DEBOUNCE_MS);

  expect(current()).toBe('status=active&q=48231');
  expect(history).toHaveLength(2);
});
