import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapContainer, Marker } from 'react-leaflet';
import { IS_MAPBOX_CONFIGURED } from '@/shared/config';
import { usePrefersReducedMotion } from '@/shared/lib/dom';
import type { GeoPoint } from '@/shared/lib/geo';
import { toLatLng } from './lat-lng';
import { MAP_ATTRIBUTION_POSITION, MAP_CLASS, MAP_PLACED_CLASS, MAP_TEXTS, MAP_ZOOM } from './map';
import { MapTiles } from './MapTiles';
import { MapUnavailable } from './MapUnavailable';
import { POSITION_ICON } from './position-icon';
import './route-map.css';

type PositionMapProps = {
  point: GeoPoint;
  // The parent sets the height of the map.
  className: string;
};

// Where the courier is: the map follows the point and cannot be moved or zoomed by hand.
export function PositionMap({ point, className }: PositionMapProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { latitude, longitude } = point;

  useEffect(() => {
    map?.setView([latitude, longitude], map.getZoom(), { animate: !prefersReducedMotion });
  }, [map, latitude, longitude, prefersReducedMotion]);

  if (!IS_MAPBOX_CONFIGURED) {
    return <MapUnavailable className={className} />;
  }

  return (
    <div className={`relative ${className}`}>
      <div
        role="region"
        aria-label={MAP_TEXTS.POSITION_LABEL}
        className={`${MAP_CLASS.VIEW} ${MAP_CLASS.VIEW_STATIC} ${MAP_PLACED_CLASS}`}
      >
        {/* `isolate` keeps the high z-index values of Leaflet inside the map. */}
        <MapContainer
          ref={setMap}
          center={toLatLng(point)}
          zoom={MAP_ZOOM.FOCUS}
          zoomControl={false}
          zoomAnimation={!prefersReducedMotion}
          attributionControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          boxZoom={false}
          keyboard={false}
          className="isolate size-full"
        >
          <MapTiles attributionPosition={MAP_ATTRIBUTION_POSITION.VIEW} />
          <Marker
            position={toLatLng(point)}
            icon={POSITION_ICON}
            interactive={false}
            keyboard={false}
          />
        </MapContainer>
      </div>
    </div>
  );
}
