import type { Map as LeafletMap } from 'leaflet';
import { useEffect } from 'react';

// The map is moved and zoomed by the mouse and the touch only while the interactions are on.
// Leaflet creates every handler even when its option is off, so they can be turned on later.
export function useMapInteractions(map: LeafletMap | null, isEnabled: boolean) {
  useEffect(() => {
    if (map === null) {
      return;
    }

    const handlers = [
      map.dragging,
      map.scrollWheelZoom,
      map.touchZoom,
      map.doubleClickZoom,
      map.boxZoom,
    ];

    for (const handler of handlers) {
      if (isEnabled) {
        handler.enable();
      } else {
        handler.disable();
      }
    }
  }, [map, isEnabled]);
}
