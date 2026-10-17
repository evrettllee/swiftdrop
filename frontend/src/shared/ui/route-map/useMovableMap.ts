import type { Map as LeafletMap } from 'leaflet';
import { useState } from 'react';
import { useFullscreenMap } from './useFullscreenMap';

// The state of a map that moves in the page and can take the full screen: the parent keeps it, so
// it can steer the map (follow the courier, fit a route), and gives it to MovableMapFrame.
export function useMovableMap() {
  const [map, setMap] = useState<LeafletMap | null>(null);

  return { map, setMap, ...useFullscreenMap(map) };
}

export type MovableMap = ReturnType<typeof useMovableMap>;
