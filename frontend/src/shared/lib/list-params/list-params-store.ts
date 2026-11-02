import { type Clock, PAGE_CLOCK } from '@/shared/lib/clock';
import {
  applyListPatch,
  type ListParamsConfig,
  type ListParamValues,
  readListParams,
  writeListParams,
} from './list-params';

export const LIST_SEARCH_DEBOUNCE_MS = 300;

export const LIST_HISTORY_MODE = {
  PUSH: 'push',
  REPLACE: 'replace',
} as const;

export type ListHistoryMode = (typeof LIST_HISTORY_MODE)[keyof typeof LIST_HISTORY_MODE];

export type ListNavigation = {
  write: (next: (current: URLSearchParams) => URLSearchParams, mode: ListHistoryMode) => void;
};

export type ListParamsStore<T extends ListParamValues> = {
  update: (patch: Partial<T>) => void;
  typeSearch: (text: string) => void;
  cancelSearch: () => void;
};

function searchPatch<T extends ListParamValues>(
  config: ListParamsConfig<T>,
  text: string,
): Partial<T> {
  const patch: Partial<T> = {};
  const trimmed = text.trim();

  if (config.searchKey !== undefined) {
    Object.assign(patch, { [config.searchKey]: trimmed === '' ? null : trimmed });
  }

  return patch;
}

function writePatch<T extends ListParamValues>(
  config: ListParamsConfig<T>,
  navigation: ListNavigation,
  patch: Partial<T>,
  mode: ListHistoryMode,
): void {
  navigation.write(
    (current) =>
      writeListParams(
        current,
        applyListPatch(readListParams(current, config), patch, config),
        config,
      ),
    mode,
  );
}

export function createListParamsStore<T extends ListParamValues>(
  config: ListParamsConfig<T>,
  navigation: ListNavigation,
  clock: Clock = PAGE_CLOCK,
  delayMs: number = LIST_SEARCH_DEBOUNCE_MS,
): ListParamsStore<T> {
  let timer: number | null = null;
  let pendingText: string | null = null;

  function cancelSearch(): void {
    if (timer !== null) {
      clock.clearTimeout(timer);
      timer = null;
    }

    pendingText = null;
  }

  function update(patch: Partial<T>): void {
    const pending = pendingText === null ? {} : searchPatch(config, pendingText);
    cancelSearch();
    writePatch(config, navigation, { ...pending, ...patch }, LIST_HISTORY_MODE.PUSH);
  }

  function typeSearch(text: string): void {
    if (config.searchKey === undefined) {
      return;
    }

    cancelSearch();
    pendingText = text;
    timer = clock.setTimeout(() => {
      timer = null;
      pendingText = null;
      writePatch(config, navigation, searchPatch(config, text), LIST_HISTORY_MODE.REPLACE);
    }, delayMs);
  }

  return { update, typeSearch, cancelSearch };
}
