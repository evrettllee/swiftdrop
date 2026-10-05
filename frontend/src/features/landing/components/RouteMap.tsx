import { CursorIcon, MinusIcon, PlusIcon } from '@phosphor-icons/react';
import {
  divIcon,
  type DivIcon,
  type LeafletEvent,
  type Map as LeafletMap,
  type Marker as LeafletMarker,
} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMemo, useState } from 'react';
import {
  AttributionControl,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMapEvents,
} from 'react-leaflet';
import { MAPBOX_TOKEN } from '../../../shared/config';
import { ICON_SIZE, ICON_WEIGHT } from '../../../shared/constants';
import { THEME } from '../../../shared/theme/constants';
import { useThemeStore } from '../../../shared/theme/store';
import type { GeoPoint } from '../../pricing/types';
import {
  MAP_ATTRIBUTION,
  MAP_CENTER,
  MAP_CLASS,
  MAP_MARKER_HIT_SIZE,
  MAP_MARKER_TAG_OFFSET,
  MAP_TEXTS,
  MAP_TILES,
  MAP_ZOOM,
  ROUTE_POINT,
  ROUTE_POINT_LABELS,
} from '../constants';
import type { RoutePointKind } from '../types';
import './route-map.css';

type RouteMapProps = {
  pickup: GeoPoint | null;
  delivery: GeoPoint | null;
  // The point that the next click sets: the hint on the map names it.
  target: RoutePointKind;
  onPick: (point: GeoPoint) => void;
  onMove: (kind: RoutePointKind, point: GeoPoint) => void;
  // The parent sets the size of the map.
  className?: string;
};

function createMarkerIcon(dotClass: string): DivIcon {
  return divIcon({
    className: MAP_CLASS.MARKER,
    html: `<span class="${MAP_CLASS.DOT} ${dotClass}"></span>`,
    iconSize: [MAP_MARKER_HIT_SIZE, MAP_MARKER_HIT_SIZE],
    iconAnchor: [MAP_MARKER_HIT_SIZE / 2, MAP_MARKER_HIT_SIZE / 2],
    tooltipAnchor: [0, -MAP_MARKER_TAG_OFFSET],
  });
}

const MARKER_ICONS: Record<RoutePointKind, DivIcon> = {
  [ROUTE_POINT.PICKUP]: createMarkerIcon(MAP_CLASS.DOT_PICKUP),
  [ROUTE_POINT.DELIVERY]: createMarkerIcon(MAP_CLASS.DOT_DELIVERY),
};

const HINTS: Record<RoutePointKind, string> = {
  [ROUTE_POINT.PICKUP]: MAP_TEXTS.HINT_PICKUP,
  [ROUTE_POINT.DELIVERY]: MAP_TEXTS.HINT_DELIVERY,
};

const ZOOM_BUTTON_CLASS =
  'flex size-11 items-center justify-center text-fg transition-colors duration-150 hover:bg-selected active:bg-border motion-reduce:transition-none';

// {z}, {x}, {y} and {r} (the retina suffix) are filled in by Leaflet.
function buildTileUrl(style: string): string {
  return `${MAP_TILES.BASE_URL}/${style}/tiles/${MAP_TILES.TILE_SIZE}/{z}/{x}/{y}{r}?access_token=${MAPBOX_TOKEN}`;
}

function ClickHandler({ onPick }: { onPick: (point: GeoPoint) => void }) {
  useMapEvents({
    click: (event) => onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
  });

  return null;
}

type RouteMarkerProps = {
  kind: RoutePointKind;
  point: GeoPoint;
  onMove: (kind: RoutePointKind, point: GeoPoint) => void;
};

// A point can be dragged to fine-tune it after the click.
function RouteMarker({ kind, point, onMove }: RouteMarkerProps) {
  const eventHandlers = useMemo(
    () => ({
      dragend: (event: LeafletEvent) => {
        const { lat, lng } = (event.target as LeafletMarker).getLatLng();
        onMove(kind, { latitude: lat, longitude: lng });
      },
    }),
    [kind, onMove],
  );

  return (
    <Marker
      position={[point.latitude, point.longitude]}
      icon={MARKER_ICONS[kind]}
      draggable
      eventHandlers={eventHandlers}
    >
      <Tooltip permanent direction="top" className={MAP_CLASS.TAG}>
        {ROUTE_POINT_LABELS[kind]}
      </Tooltip>
    </Marker>
  );
}

export function RouteMap({
  pickup,
  delivery,
  target,
  onPick,
  onMove,
  className = '',
}: RouteMapProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const theme = useThemeStore((state) => state.theme);
  const tileUrl = buildTileUrl(theme === THEME.DARK ? MAP_TILES.DARK_STYLE : MAP_TILES.LIGHT_STYLE);

  return (
    <div
      role="region"
      aria-label={MAP_TEXTS.REGION_LABEL}
      className={`relative overflow-hidden rounded-lg border border-border bg-field ${className}`}
    >
      {/* `isolate` keeps the high z-index values of Leaflet inside the map, below the sticky header. */}
      <MapContainer
        ref={setMap}
        center={MAP_CENTER}
        zoom={MAP_ZOOM.DEFAULT}
        minZoom={MAP_ZOOM.MIN}
        maxZoom={MAP_ZOOM.MAX}
        zoomControl={false}
        attributionControl={false}
        className="isolate size-full"
      >
        {/* The key reloads the tiles when the theme changes. */}
        <TileLayer
          key={tileUrl}
          url={tileUrl}
          tileSize={MAP_TILES.TILE_SIZE}
          zoomOffset={MAP_TILES.ZOOM_OFFSET}
          attribution={MAP_ATTRIBUTION}
        />
        <AttributionControl position="bottomright" prefix={false} />
        <ClickHandler onPick={onPick} />
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
          <RouteMarker kind={ROUTE_POINT.PICKUP} point={pickup} onMove={onMove} />
        )}
        {delivery === null ? null : (
          <RouteMarker kind={ROUTE_POINT.DELIVERY} point={delivery} onMove={onMove} />
        )}
      </MapContainer>

      <div className="absolute end-4 top-4 flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-md">
        <button
          type="button"
          aria-label={MAP_TEXTS.ZOOM_IN}
          onClick={() => map?.zoomIn()}
          className={`${ZOOM_BUTTON_CLASS} border-b border-border`}
        >
          <PlusIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={MAP_TEXTS.ZOOM_OUT}
          onClick={() => map?.zoomOut()}
          className={ZOOM_BUTTON_CLASS}
        >
          <MinusIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
        </button>
      </div>

      <div className="pointer-events-none absolute start-4 bottom-4 flex max-w-[calc(100%-9rem)] items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-small shadow-md">
        <CursorIcon
          size={ICON_SIZE.SMALL}
          weight={ICON_WEIGHT}
          aria-hidden="true"
          className="shrink-0 text-fg-secondary"
        />
        <span>{HINTS[target]}</span>
      </div>
    </div>
  );
}
