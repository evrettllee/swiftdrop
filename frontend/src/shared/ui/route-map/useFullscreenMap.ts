import type { Map as LeafletMap } from 'leaflet';
import { useCallback, useEffect, useRef, useState } from 'react';

const FULLSCREEN_CHANGE_EVENT = 'fullscreenchange';

// The map can take the full screen of the browser (Fullscreen API): Escape is handled by the
// browser, and Leaflet is told about the new size, because it does not notice the change by itself.
// A browser without the API (an iPhone) gets no button at all.
export function useFullscreenMap(map: LeafletMap | null) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isSupported = document.fullscreenEnabled === true;

  useEffect(() => {
    const container = containerRef.current;

    function handleChange(): void {
      setIsFullscreen(container !== null && document.fullscreenElement === container);
    }

    document.addEventListener(FULLSCREEN_CHANGE_EVENT, handleChange);

    return () => {
      document.removeEventListener(FULLSCREEN_CHANGE_EVENT, handleChange);

      // The map leaves the page (the offer is answered) while it is in the full screen.
      if (container !== null && document.fullscreenElement === container) {
        void document.exitFullscreen().catch(() => undefined);
      }
    };
  }, []);

  useEffect(() => {
    map?.invalidateSize();
  }, [map, isFullscreen]);

  // A refusal of the browser (no user gesture, a policy of the page) leaves the map as it is.
  const toggle = useCallback(() => {
    if (document.fullscreenElement === null) {
      void containerRef.current?.requestFullscreen().catch(() => undefined);
    } else {
      void document.exitFullscreen().catch(() => undefined);
    }
  }, []);

  return { containerRef, isFullscreen, isSupported, toggle };
}
