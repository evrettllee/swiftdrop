import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  type ListParamsConfig,
  type ListParamValues,
  type ListUntil,
  listParamsKey,
  readListParams,
  untilForKey,
} from './list-params';
import { createListParamsStore, LIST_HISTORY_MODE } from './list-params-store';

export type ListParams<T extends ListParamValues> = {
  values: T;
  update: (patch: Partial<T>) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  until: number | null;
  setUntil: (until: number | null) => void;
  resetUntil: () => void;
};

function searchOf<T extends ListParamValues>(values: T, config: ListParamsConfig<T>): string {
  const value = config.searchKey === undefined ? null : values[config.searchKey];

  return typeof value === 'string' ? value : '';
}

export function useListParams<T extends ListParamValues>(
  config: ListParamsConfig<T>,
): ListParams<T> {
  const [searchParams, setSearchParams] = useSearchParams();
  const values = useMemo(() => readListParams(searchParams, config), [searchParams, config]);
  const key = listParamsKey(values, config);
  const urlSearch = searchOf(values, config);
  const [searchText, setText] = useState(urlSearch);
  const [syncedSearch, setSyncedSearch] = useState(urlSearch);
  const [untilState, setUntilState] = useState<ListUntil | null>(null);

  if (urlSearch !== syncedSearch) {
    setSyncedSearch(urlSearch);

    if (urlSearch !== searchText.trim()) {
      setText(urlSearch);
    }
  }

  const store = useMemo(
    () =>
      createListParamsStore(config, {
        write: (next, mode) =>
          setSearchParams(next, { replace: mode === LIST_HISTORY_MODE.REPLACE }),
      }),
    [config, setSearchParams],
  );

  useEffect(() => () => store.cancelSearch(), [store]);

  const setSearchText = useCallback(
    (text: string) => {
      setText(text);
      store.typeSearch(text);
    },
    [store],
  );

  const setUntil = useCallback(
    (until: number | null) => setUntilState(until === null ? null : { key, until }),
    [key],
  );

  const resetUntil = useCallback(() => setUntilState(null), []);

  return {
    values,
    update: store.update,
    searchText,
    setSearchText,
    until: untilForKey(untilState, key),
    setUntil,
    resetUntil,
  };
}
