import 'leaflet/dist/leaflet.css';
import type { ReactNode } from 'react';
import { MapContainer } from 'react-leaflet';
import { IS_MAPBOX_CONFIGURED } from '@/shared/config';
import { usePrefersReducedMotion } from '@/shared/lib/dom';
import type { GeoPoint } from '@/shared/lib/geo';
import { toLatLng } from './lat-lng';
import {
  MAP_ATTRIBUTION_POSITION,
  MAP_CLASS,
  MAP_FULLSCREEN_CLASS,
  MAP_PLACED_CLASS,
  MAP_ZOOM_AROUND_CENTER,
} from './map';
import { MapControls } from './MapControls';
import { MapTiles } from './MapTiles';
import { MapUnavailable } from './MapUnavailable';
import type { MovableMap } from './useMovableMap';
import './route-map.css';

type MovableMapFrameProps = {
  frame: MovableMap;
  // The name of the region for screen readers.
  label: string;
  center: GeoPoint;
  zoom: number;
  // «Ко мне»; without it the button is not shown.
  onLocate?: () => void;
  // Above the map, outside Leaflet, for example the badge of a missing route.
  overlay?: ReactNode;
  // The parent sets the height of the map.
  className: string;
  // The layers of the map: markers and lines.
  children: ReactNode;
};

// A map that moves in the page: the wheel, the pinch and the double click zoom around the center,
// the zoom buttons are on the desktop and in the full screen (MapControls), «Ко мне» and the full
// screen of the browser are there too.
export function MovableMapFrame({
  frame,
  label,
  center,
  zoom,
  onLocate,
  overlay,
  className,
  children,
}: MovableMapFrameProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { map, setMap, containerRef, isFullscreen, isSupported, toggle } = frame;

  if (!IS_MAPBOX_CONFIGURED) {
    return <MapUnavailable className={className} />;
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        role="region"
        aria-label={label}
        className={`${MAP_CLASS.VIEW} ${MAP_PLACED_CLASS} ${MAP_FULLSCREEN_CLASS}`}
      >
        {/* `isolate` keeps the high z-index values of Leaflet inside the map. */}
        <MapContainer
          ref={setMap}
          center={toLatLng(center)}
          zoom={zoom}
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
          {children}
        </MapContainer>
        <MapControls
          map={map}
          onLocate={onLocate}
          isFullscreen={isFullscreen}
          onToggleFullscreen={isSupported ? toggle : undefined}
        />
        {overlay}
      </div>
    </div>
  );
}
