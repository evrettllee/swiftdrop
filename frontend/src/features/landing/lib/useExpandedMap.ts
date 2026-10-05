import type { Map as LeafletMap } from 'leaflet';
import { useCallback, useEffect, useState } from 'react';
import { ESCAPE_KEY } from '../constants';

// The map can cover the whole screen: the page below it does not scroll, Escape closes the map,
// and Leaflet is told about the new size, because it does not notice the change by itself.
export function useExpandedMap(map: LeafletMap | null) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    map?.invalidateSize();
  }, [map, isExpanded]);

  useEffect(() => {
    if (!isExpanded) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === ESCAPE_KEY) {
        setIsExpanded(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  const toggle = useCallback(() => setIsExpanded((current) => !current), []);

  return { isExpanded, toggle };
}
