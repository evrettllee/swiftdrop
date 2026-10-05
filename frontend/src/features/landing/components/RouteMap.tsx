import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { MapContainer, Polyline, useMapEvents } from 'react-leaflet';
import { IS_MAPBOX_CONFIGURED } from '../../../shared/config';
import { CITY_CENTER } from '../../../shared/constants';
import type { GeoPoint } from '../../pricing/types';
import { MAP_CLASS, MAP_PLACED_CLASS, MAP_TEXTS, MAP_ZOOM, ROUTE_POINT } from '../constants';
import { useExpandedMap } from '../lib/useExpandedMap';
import type { RoutePointKind } from '../types';
import { FitToPoints } from './FitToPoints';
import { MapControls } from './MapControls';
import { MapHint } from './MapHint';
import { MapTiles } from './MapTiles';
import { MapUnavailable } from './MapUnavailable';
import { RouteMarker } from './RouteMarker';
import './route-map.css';

type RouteMapProps = {
  pickup: GeoPoint | null;
  delivery: GeoPoint | null;
  // The missing point that the next click sets; `null` when both points are set (no hint).
  hint: RoutePointKind | null;
  onPick: (point: GeoPoint) => void;
  onMove: (kind: RoutePointKind, point: GeoPoint) => void;
  onRemove: (kind: RoutePointKind) => void;
  // The parent sets the size of the map.
  className?: string;
};

// The map fills its place in the page; expanded, it covers the whole screen above the header.
const MAP_EXPANDED_CLASS = 'fixed inset-0 z-50 bg-field';

function ClickHandler({ onPick }: { onPick: (point: GeoPoint) => void }) {
  useMapEvents({
    click: (event) => onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
  });

  return null;
}

export function RouteMap({
  pickup,
  delivery,
  hint,
  onPick,
  onMove,
  onRemove,
  className = '',
}: RouteMapProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const { isExpanded, toggle } = useExpandedMap(map);

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
          attributionControl={false}
          className="isolate size-full"
        >
          <MapTiles />
          <ClickHandler onPick={onPick} />
          <FitToPoints pickup={pickup} delivery={delivery} />
          {pickup !== null && delivery !== null ? (
            <Polyline
              positions={[
                [pickup.latitude, pickup.longitude],
                [delivery.latitude, delivery.longitude],
              ]}
              pathOptions={{ className: MAP_CLASS.LINE, interactive: false }}
            />
          ) : null}
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
        <MapControls map={map} isExpanded={isExpanded} onToggleExpand={toggle} />
        {hint === null ? null : <MapHint kind={hint} />}
      </div>
    </div>
  );
}
