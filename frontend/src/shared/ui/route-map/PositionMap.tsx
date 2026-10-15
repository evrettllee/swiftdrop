import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapContainer, Marker } from 'react-leaflet';
import { IS_MAPBOX_CONFIGURED } from '@/shared/config';
import { usePrefersReducedMotion } from '@/shared/lib/dom';
import type { GeoPoint } from '@/shared/lib/geo';
import { toLatLng } from './lat-lng';
import {
  LEAFLET_EVENT,
  MAP_ATTRIBUTION_POSITION,
  MAP_CLASS,
  MAP_PLACED_CLASS,
  MAP_TEXTS,
  MAP_ZOOM,
  MAP_ZOOM_AROUND_CENTER,
} from './map';
import { MapControls } from './MapControls';
import { MapTiles } from './MapTiles';
import { MapUnavailable } from './MapUnavailable';
import { POSITION_ICON, POSITION_ICON_STILL } from './position-icon';
import './route-map.css';

type PositionMapProps = {
  point: GeoPoint;
  // The rings pulse while orders are searched for.
  isPulsing: boolean;
  // The parent sets the height of the map.
  className: string;
};

// Where the courier is. The map follows the point until the courier drags it away; «Ко мне» brings
// it back. The wheel and the pinch zoom around the center, so they never stop the following.
export function PositionMap({ point, isPulsing, className }: PositionMapProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { latitude, longitude } = point;

  useEffect(() => {
    if (isFollowing) {
      map?.setView([latitude, longitude], map.getZoom(), { animate: !prefersReducedMotion });
    }
  }, [map, isFollowing, latitude, longitude, prefersReducedMotion]);

  useEffect(() => {
    const stopFollowing = () => setIsFollowing(false);

    map?.on(LEAFLET_EVENT.DRAG_START, stopFollowing);

    return () => {
      map?.off(LEAFLET_EVENT.DRAG_START, stopFollowing);
    };
  }, [map]);

  // Also after a following that is still on: the zoom stays, the point comes back to the center.
  function handleLocate(): void {
    setIsFollowing(true);
    map?.setView([latitude, longitude], map.getZoom(), { animate: !prefersReducedMotion });
  }

  if (!IS_MAPBOX_CONFIGURED) {
    return <MapUnavailable className={className} />;
  }

  return (
    <div className={`relative ${className}`}>
      <div
        role="region"
        aria-label={MAP_TEXTS.POSITION_LABEL}
        className={`${MAP_CLASS.VIEW} ${MAP_PLACED_CLASS}`}
      >
        {/* `isolate` keeps the high z-index values of Leaflet inside the map. */}
        <MapContainer
          ref={setMap}
          center={toLatLng(point)}
          zoom={MAP_ZOOM.FOCUS}
          zoomControl={false}
          zoomAnimation={!prefersReducedMotion}
          attributionControl={false}
          scrollWheelZoom={MAP_ZOOM_AROUND_CENTER}
          touchZoom={MAP_ZOOM_AROUND_CENTER}
          doubleClickZoom={MAP_ZOOM_AROUND_CENTER}
          boxZoom={false}
          keyboard={false}
          className="isolate size-full"
        >
          <MapTiles attributionPosition={MAP_ATTRIBUTION_POSITION.VIEW} />
          <Marker
            position={toLatLng(point)}
            icon={isPulsing ? POSITION_ICON : POSITION_ICON_STILL}
            interactive={false}
            keyboard={false}
          />
        </MapContainer>
        <MapControls map={map} onLocate={handleLocate} />
      </div>
    </div>
  );
}
