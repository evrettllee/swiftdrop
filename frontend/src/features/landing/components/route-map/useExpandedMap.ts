import type { Map as LeafletMap } from 'leaflet';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { matchesMediaQuery, subscribeToMediaQuery } from '../../../../shared/lib/mediaQuery';
import { useEscapeKey } from '../../../../shared/lib/useEscapeKey';
import { REDUCED_MOTION_QUERY } from '../../constants/map';

function subscribeToReducedMotion(onChange: () => void): () => void {
  return subscribeToMediaQuery(REDUCED_MOTION_QUERY, onChange);
}

function readReducedMotion(): boolean {
  return matchesMediaQuery(REDUCED_MOTION_QUERY);
}

// Leaflet animates zoom and moves in JavaScript, so the CSS `motion-reduce:` variant does not reach it.
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeToReducedMotion, readReducedMotion);
}

// The map can cover the whole screen: the page below it does not scroll, Escape closes the map,
// and Leaflet is told about the new size, because it does not notice the change by itself.
export function useExpandedMap(map: LeafletMap | null) {
  const [isExpanded, setIsExpanded] = useState(false);
  // The focus is moved to the toggle button explicitly: Safari does not focus a clicked button,
  // and Escape may come while the focus is on a marker or on the page body.
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    map?.invalidateSize();
  }, [map, isExpanded]);

  useEscapeKey(() => {
    setIsExpanded(false);
    toggleButtonRef.current?.focus();
  }, isExpanded);

  useEffect(() => {
    if (!isExpanded) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isExpanded]);

  const toggle = useCallback(() => {
    setIsExpanded((current) => !current);
    toggleButtonRef.current?.focus();
  }, []);

  return { isExpanded, toggle, toggleButtonRef };
}
