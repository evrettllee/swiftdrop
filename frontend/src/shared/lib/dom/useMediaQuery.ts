import { useCallback, useSyncExternalStore } from 'react';
import { matchesMediaQuery, subscribeToMediaQuery } from './media-query';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeToMediaQuery(query, onStoreChange),
    [query],
  );

  return useSyncExternalStore(subscribe, () => matchesMediaQuery(query));
}
