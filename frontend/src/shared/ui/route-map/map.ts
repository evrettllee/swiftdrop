import type { ControlPosition } from 'leaflet';
import { MAPBOX_API_ORIGIN } from '@/shared/config';

// The zoom range (12 shows the whole city core)
export const MAP_ZOOM = {
  DEFAULT: 12,
  MIN: 9,
  MAX: 18,
  FOCUS: 15,
  FIT_MAX: 16,
} as const;

// Space between the points and the edge of the map when it is fitted to them: the tags and the
// controls must not cover the points.
export const MAP_FIT_PADDING = 64;
// The map of an order is small and has no tags or controls, so the points may come closer.
export const MAP_VIEW_FIT_PADDING = 32;
// Leaflet zooms around the center instead of the cursor or the fingers with this value.
export const MAP_ZOOM_AROUND_CENTER = 'center';

// The events of the Leaflet map the app listens to.
export const LEAFLET_EVENT = {
  DRAG_START: 'dragstart',
} as const;

// The column of the controls (44px buttons, 12px from the edge) and a gap to it: the points are
// fitted to the rest of the map.
export const MAP_CONTROLS_CLEARANCE = 72;
// The bottom-right padding of a map of an order with the column of the controls: the points stay to
// the left of it.
export const MAP_VIEW_CONTROLS_FIT_PADDING: [number, number] = [
  MAP_CONTROLS_CLEARANCE,
  MAP_VIEW_FIT_PADDING,
];

// The map of an offer is lower still: the area and the pickup point come close to its edge, but
// stay above the attribution in the bottom-left corner (8px margin, 26px high, 6px more for the dot).
export const MAP_AREA_FIT_PADDING = 12;
export const MAP_AREA_FIT_PADDING_BOTTOM = 40;

// Mapbox raster tiles (Static Tiles API) of its light and dark styles, one for each theme.
// A tile is 512px, so Leaflet has to shift the zoom by -1.
export const MAP_TILES = {
  BASE_URL: `${MAPBOX_API_ORIGIN}/styles/v1`,
  LIGHT_STYLE: 'mapbox/light-v11',
  DARK_STYLE: 'mapbox/dark-v11',
  TILE_SIZE: 512,
  ZOOM_OFFSET: -1,
} as const;

// The map of the calculator keeps the attribution on the right, the map of an order on the left.
export const MAP_ATTRIBUTION_POSITION = {
  PLACED: 'bottomright',
  VIEW: 'bottomleft',
} as const satisfies Record<string, ControlPosition>;

export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noreferrer">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

// A marker is a 10px dot (route-map.css) inside a 44px touch area.
export const MAP_MARKER_HIT_SIZE = 44;
// Distance from the marker center to the tag above it.
export const MAP_MARKER_TAG_OFFSET = 14;

// The frame of the map in its place in the page; the placeholder of a missing map uses it too.
export const MAP_PLACED_CLASS =
  'absolute inset-0 overflow-hidden rounded-lg border border-border bg-field';
// The map in the full screen of the browser (Fullscreen API) loses the frame of its place.
export const MAP_FULLSCREEN_CLASS = '[&:fullscreen]:rounded-none [&:fullscreen]:border-0';

// Class names used by route-map.css

export const MAP_CLASS = {
  MARKER: 'route-marker',
  DOT: 'route-marker__dot',
  DOT_PICKUP: 'route-marker__dot--pickup',
  DOT_DELIVERY: 'route-marker__dot--delivery',
  TAG: 'route-tag',
  TAG_PICKUP: 'route-tag--pickup',
  TAG_DELIVERY: 'route-tag--delivery',
  LINE: 'route-line',
  LINE_LIVE: 'route-line--live',
  COURIER_ETA: 'courier-eta',
  COURIER_ETA_PILL: 'courier-eta__pill',
  COURIER_ETA_CIRCLE: 'courier-eta__circle',
  COURIER_ETA_TEXT: 'courier-eta__text',
  COURIER_ETA_OFFLINE: 'courier-eta--offline',
  VIEW: 'route-map-view',
  POSITION: 'position-marker',
  POSITION_DOT: 'position-marker__dot',
  POSITION_PULSE: 'position-marker__pulse',
  POSITION_PULSE_LATE: 'position-marker__pulse--late',
  AREA: 'delivery-area',
  PANEL: 'map-panel',
  ZONE: 'map-zone',
  ZONE_SELECTED: 'map-zone--selected',
  ZONE_OFF: 'map-zone--off',
  ZONE_LABEL: 'map-zone-label',
  ZONE_GHOST: 'map-zone--ghost',
  PIN: 'map-pin',
  PIN_BODY: 'map-pin__body',
  PIN_HALO: 'map-pin__halo',
  PIN_CIRCLE: 'map-pin__circle',
  PIN_SELECTED: 'map-pin__body--selected',
} as const;

// The dot of the position of the courier, 16px across (position-marker in route-map.css).
export const POSITION_MARKER_SIZE = 16;

export const COURIER_ETA_ANCHOR = 24;

export const MAP_TEXTS = {
  REGION_LABEL: 'Карта города: отметьте точки «Откуда» и «Куда»',
  VIEW_LABEL: 'Схема маршрута',
  POSITION_LABEL: 'Ваше местоположение',
  AREA_LABEL: 'Точка забора и район доставки',
  COURIER_ROUTE_LABEL: 'Маршрут заказа',
  HINT_PICKUP: 'Отметьте точку «Откуда»',
  HINT_DELIVERY: 'Отметьте точку «Куда»',
  ZOOM_IN: 'Приблизить',
  ZOOM_OUT: 'Отдалить',
  LOCATE: 'Ко мне',
  FULLSCREEN: 'На весь экран',
  EXIT_FULLSCREEN: 'Свернуть',
  REMOVE_POINT: (pointLabel: string) => `Убрать точку «${pointLabel}»`,
  UNAVAILABLE: 'Карта временно недоступна',
  ROUTE_UNAVAILABLE: 'Маршрут недоступен',
  // Shown to a developer only (the dev server), not to a visitor.
  UNAVAILABLE_DEV_HINT: 'Задайте VITE_MAPBOX_TOKEN в файле .env в корне репозитория.',
} as const;
