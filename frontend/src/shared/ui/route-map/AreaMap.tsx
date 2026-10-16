import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { Circle, MapContainer, Marker } from 'react-leaflet';
import { IS_MAPBOX_CONFIGURED, ROUTE_POINT } from '@/shared/config';
import { usePrefersReducedMotion } from '@/shared/lib/dom';
import type { GeoPoint } from '@/shared/lib/geo';
import type { MapRoute } from '@/shared/lib/route-lines';
import { toLatLng } from './lat-lng';
import {
  MAP_ATTRIBUTION_POSITION,
  MAP_CLASS,
  MAP_FULLSCREEN_CLASS,
  MAP_PLACED_CLASS,
  MAP_TEXTS,
  MAP_ZOOM,
} from './map';
import { MapControls } from './MapControls';
import { MapTiles } from './MapTiles';
import { MapUnavailable } from './MapUnavailable';
import { MARKER_ICONS } from './marker-icons';
import { POSITION_ICON, POSITION_ICON_STILL } from './position-icon';
import { RouteLines } from './RouteLines';
import { RouteUnavailableBadge } from './RouteUnavailableBadge';
import { useFitArea } from './useFitArea';
import { useFullscreenMap } from './useFullscreenMap';
import './route-map.css';

type AreaMapProps = {
  pickup: GeoPoint;
  // The delivery is known only to an area: a dashed circle instead of a point.
  areaCenter: GeoPoint;
  areaRadiusM: number;
  // Where the courier is: the marker and «Ко мне»; null hides both.
  courierPoint: GeoPoint | null;
  // The rings of the courier pulse while orders are searched for, as on the work page.
  isCourierPulsing: boolean;
  // The way of the courier to the pickup point along the roads, when it is there.
  route: MapRoute;
  // The parent sets the height of the map.
  className: string;
};

// The pickup point and the area of the delivery of an order that is not taken yet, with the courier,
// fitted to all of them. It moves and zooms by hand, but not with the wheel: the wheel scrolls the window the map
// is in. The map is too low for the whole column of the controls, so the zoom buttons, and the
// wheel, are in the full screen only.
export function AreaMap({
  pickup,
  areaCenter,
  areaRadiusM,
  courierPoint,
  isCourierPulsing,
  route,
  className,
}: AreaMapProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const { containerRef, isFullscreen, isSupported, toggle } = useFullscreenMap(map);
  const prefersReducedMotion = usePrefersReducedMotion();
  useFitArea(map, pickup, areaCenter, areaRadiusM, courierPoint, route.lines);

  useEffect(() => {
    if (isFullscreen) {
      map?.scrollWheelZoom.enable();
    } else {
      map?.scrollWheelZoom.disable();
    }
  }, [map, isFullscreen]);

  // The zoom of the map of the position on the work page.
  function handleLocate(point: GeoPoint): void {
    map?.setView(toLatLng(point), MAP_ZOOM.FOCUS, { animate: !prefersReducedMotion });
  }

  if (!IS_MAPBOX_CONFIGURED) {
    return <MapUnavailable className={className} />;
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        role="region"
        aria-label={MAP_TEXTS.AREA_LABEL}
        className={`${MAP_CLASS.VIEW} ${MAP_PLACED_CLASS} ${MAP_FULLSCREEN_CLASS}`}
      >
        {/* `isolate` keeps the high z-index values of Leaflet inside the map. */}
        <MapContainer
          ref={setMap}
          center={toLatLng(pickup)}
          zoom={MAP_ZOOM.DEFAULT}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={false}
          boxZoom={false}
          keyboard={false}
          className="isolate size-full"
        >
          <MapTiles attributionPosition={MAP_ATTRIBUTION_POSITION.VIEW} />
          <Circle
            center={toLatLng(areaCenter)}
            radius={areaRadiusM}
            pathOptions={{ className: MAP_CLASS.AREA, interactive: false }}
          />
          <RouteLines lines={route.lines} />
          <Marker
            position={toLatLng(pickup)}
            icon={MARKER_ICONS[ROUTE_POINT.PICKUP]}
            interactive={false}
            keyboard={false}
          />
          {courierPoint === null ? null : (
            <Marker
              position={toLatLng(courierPoint)}
              icon={isCourierPulsing ? POSITION_ICON : POSITION_ICON_STILL}
              interactive={false}
              keyboard={false}
            />
          )}
        </MapContainer>
        <MapControls
          map={map}
          onLocate={courierPoint === null ? undefined : () => handleLocate(courierPoint)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={isSupported ? toggle : undefined}
          zoomOnlyWhenExpanded
        />
        {route.isUnavailable ? <RouteUnavailableBadge /> : null}
      </div>
    </div>
  );
}
