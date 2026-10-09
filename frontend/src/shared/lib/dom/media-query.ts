export function matchesMediaQuery(query: string): boolean {
  return window.matchMedia(query).matches;
}

// Returns the unsubscribe function, so it fits both useEffect and useSyncExternalStore.
export function subscribeToMediaQuery(
  query: string,
  onChange: (matches: boolean) => void,
): () => void {
  const mediaQuery = window.matchMedia(query);
  const handleChange = (event: MediaQueryListEvent) => onChange(event.matches);

  mediaQuery.addEventListener('change', handleChange);

  return () => mediaQuery.removeEventListener('change', handleChange);
}
