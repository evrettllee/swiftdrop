import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { MapContainer, useMapEvents } from 'react-leaflet';
import {
  CITY_CENTER,
  IS_MAPBOX_CONFIGURED,
  ROUTE_POINT,
  type RoutePointKind,
} from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';
import type { MapRoute } from '@/shared/lib/route-lines';
import { MAP_EXPANDED_CLASS, MAP_PLACED_CLASS, MAP_TEXTS, MAP_ZOOM } from './map';
import { fromLatLng } from './lat-lng';
import { usePrefersReducedMotion } from '@/shared/lib/dom';
import { useExpandedMap } from './useExpandedMap';
import { FitToPoints } from './FitToPoints';
import { MapControls } from './MapControls';
import { MapHint } from './MapHint';
import { MapTiles } from './MapTiles';
import { MapUnavailable } from './MapUnavailable';
import { RouteLines } from './RouteLines';
import { RouteMarker } from './RouteMarker';
import { RouteUnavailableBadge } from './RouteUnavailableBadge';
import './route-map.css';

type RouteMapProps = {
  pickup: GeoPoint | null;
  delivery: GeoPoint | null;
  // The line between the points along the roads, when it is there.
  route: MapRoute;
  // The missing point that the next click sets; `null` when both points are set (no hint).
  hint: RoutePointKind | null;
  onPick: (point: GeoPoint) => void;
  onMove: (kind: RoutePointKind, point: GeoPoint) => void;
  onRemove: (kind: RoutePointKind) => void;
  // The parent sets the size of the map.
  className?: string;
};

function ClickHandler({ onPick }: { onPick: (point: GeoPoint) => void }) {
  useMapEvents({
    click: (event) => onPick(fromLatLng(event.latlng)),
  });

  return null;
}

export function RouteMap({
  pickup,
  delivery,
  route,
  hint,
  onPick,
  onMove,
  onRemove,
  className = '',
}: RouteMapProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const { isExpanded, toggle, toggleButtonRef } = useExpandedMap(map);
  const prefersReducedMotion = usePrefersReducedMotion();

  if (!IS_MAPBOX_CONFIGURED) {
    return <MapUnavailable className={className} />;
  }

  return (
    // This block keeps the place of the map in the page while the map itself is expanded.
    <div className={`relative ${className}`}>
      <div
        role="region"
        aria-label={MAP_TEXTS.REGION_LABEL}
        className={isExpanded ? MAP_EXPANDED_CLASS : MAP_PLACED_CLASS}
      >
        {/* `isolate` keeps the high z-index values of Leaflet inside the map, below the sticky header. */}
        <MapContainer
          ref={setMap}
          center={CITY_CENTER}
          zoom={MAP_ZOOM.DEFAULT}
          minZoom={MAP_ZOOM.MIN}
          maxZoom={MAP_ZOOM.MAX}
          zoomControl={false}
          zoomAnimation={!prefersReducedMotion}
          attributionControl={false}
          className="isolate size-full"
        >
          <MapTiles />
          <ClickHandler onPick={onPick} />
          <FitToPoints pickup={pickup} delivery={delivery} lines={route.lines} />
          <RouteLines lines={route.lines} />
          {pickup === null ? null : (
            <RouteMarker
              kind={ROUTE_POINT.PICKUP}
              point={pickup}
              onMove={onMove}
              onRemove={onRemove}
            />
          )}
          {delivery === null ? null : (
            <RouteMarker
              kind={ROUTE_POINT.DELIVERY}
              point={delivery}
              onMove={onMove}
              onRemove={onRemove}
            />
          )}
        </MapContainer>
        <MapControls
          map={map}
          isExpanded={isExpanded}
          onToggleExpand={toggle}
          expandButtonRef={toggleButtonRef}
        />
        {hint === null ? null : <MapHint kind={hint} />}
        {route.isUnavailable ? <RouteUnavailableBadge /> : null}
      </div>
    </div>
  );
}
