import { latLng, type Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { Circle, MapContainer, Marker } from 'react-leaflet';
import { IS_MAPBOX_CONFIGURED, ROUTE_POINT } from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';
import { toLatLng } from './lat-lng';
import {
  MAP_AREA_FIT_PADDING,
  MAP_AREA_FIT_PADDING_BOTTOM,
  MAP_ATTRIBUTION_POSITION,
  MAP_CLASS,
  MAP_CONTROLS_CLEARANCE,
  MAP_PLACED_CLASS,
  MAP_TEXTS,
  MAP_ZOOM,
} from './map';
import { MapControls } from './MapControls';
import { MapTiles } from './MapTiles';
import { MapUnavailable } from './MapUnavailable';
import { MARKER_ICONS } from './marker-icons';
import './route-map.css';

type AreaMapProps = {
  pickup: GeoPoint;
  // The delivery is known only to an area: a dashed circle instead of a point.
  areaCenter: GeoPoint;
  areaRadiusM: number;
  // The parent sets the height of the map.
  className: string;
};

// The pickup point and the area of the delivery of an order that is not taken yet, fitted to both
// of them. It moves and zooms by hand and with the buttons, but not with the wheel: the wheel
// scrolls the window the map is in.
export function AreaMap({ pickup, areaCenter, areaRadiusM, className }: AreaMapProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const { latitude, longitude } = pickup;
  const { latitude: areaLatitude, longitude: areaLongitude } = areaCenter;

  // Fitted once Leaflet has the map: the window it opens in may have had no size before.
  useEffect(() => {
    if (map === null) {
      return;
    }

    const bounds = latLng(areaLatitude, areaLongitude)
      .toBounds(areaRadiusM * 2)
      .extend(latLng(latitude, longitude));

    map.invalidateSize();
    map.fitBounds(bounds, {
      paddingTopLeft: [MAP_AREA_FIT_PADDING, MAP_AREA_FIT_PADDING],
      paddingBottomRight: [MAP_CONTROLS_CLEARANCE, MAP_AREA_FIT_PADDING_BOTTOM],
      maxZoom: MAP_ZOOM.FIT_MAX,
      animate: false,
    });
  }, [map, latitude, longitude, areaLatitude, areaLongitude, areaRadiusM]);

  if (!IS_MAPBOX_CONFIGURED) {
    return <MapUnavailable className={className} />;
  }

  return (
    <div className={`relative ${className}`}>
      <div
        role="region"
        aria-label={MAP_TEXTS.AREA_LABEL}
        className={`${MAP_CLASS.VIEW} ${MAP_PLACED_CLASS}`}
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
          <Marker
            position={toLatLng(pickup)}
            icon={MARKER_ICONS[ROUTE_POINT.PICKUP]}
            interactive={false}
            keyboard={false}
          />
        </MapContainer>
        <MapControls map={map} />
      </div>
    </div>
  );
}
