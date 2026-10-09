import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { MapContainer, Marker, Polyline } from 'react-leaflet';
import { IS_MAPBOX_CONFIGURED, ROUTE_POINT } from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';
import { MAP_CLASS, MAP_EXPANDED_CLASS, MAP_PLACED_CLASS, MAP_TEXTS, MAP_ZOOM } from './map';
import { toLatLng } from './lat-lng';
import { usePrefersReducedMotion } from '@/shared/lib/dom';
import { useExpandedMap } from './useExpandedMap';
import { useFitRoute } from './useFitRoute';
import { useMapInteractions } from './useMapInteractions';
import { MapControls } from './MapControls';
import { MapTiles } from './MapTiles';
import { MapUnavailable } from './MapUnavailable';
import { MARKER_ICONS } from './marker-icons';
import './route-map.css';

type RouteMapViewProps = {
  pickup: GeoPoint;
  delivery: GeoPoint;
  // The parent sets the height of the map.
  className: string;
};

// The route of an order to look at: the points cannot be moved. In the page the map does not
// take the scroll of the page, so it neither moves nor zooms; expanded, it moves and zooms.
export function RouteMapView({ pickup, delivery, className }: RouteMapViewProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const { isExpanded, toggle, toggleButtonRef } = useExpandedMap(map);
  useMapInteractions(map, isExpanded);
  // After useExpandedMap: the route is fitted to the map once Leaflet knows its new size.
  useFitRoute(map, pickup, delivery, isExpanded);
  const prefersReducedMotion = usePrefersReducedMotion();

  if (!IS_MAPBOX_CONFIGURED) {
    return <MapUnavailable className={className} />;
  }

  return (
    // This block keeps the place of the map in the page while the map itself is expanded.
    <div className={`relative ${className}`}>
      <div
        role="region"
        aria-label={MAP_TEXTS.VIEW_LABEL}
        className={`${MAP_CLASS.VIEW} ${
          isExpanded ? MAP_EXPANDED_CLASS : `${MAP_CLASS.VIEW_STATIC} ${MAP_PLACED_CLASS}`
        }`}
      >
        {/* `isolate` keeps the high z-index values of Leaflet inside the map. */}
        <MapContainer
          ref={setMap}
          center={toLatLng(pickup)}
          zoom={MAP_ZOOM.DEFAULT}
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
          <MapTiles attributionPosition="bottomleft" />
          <Polyline
            positions={[toLatLng(pickup), toLatLng(delivery)]}
            pathOptions={{ className: MAP_CLASS.LINE, interactive: false }}
          />
          <Marker
            position={toLatLng(pickup)}
            icon={MARKER_ICONS[ROUTE_POINT.PICKUP]}
            interactive={false}
            keyboard={false}
          />
          <Marker
            position={toLatLng(delivery)}
            icon={MARKER_ICONS[ROUTE_POINT.DELIVERY]}
            interactive={false}
            keyboard={false}
          />
        </MapContainer>
        <MapControls
          map={map}
          isExpanded={isExpanded}
          onToggleExpand={toggle}
          expandButtonRef={toggleButtonRef}
          zoomOnlyWhenExpanded
        />
      </div>
    </div>
  );
}
