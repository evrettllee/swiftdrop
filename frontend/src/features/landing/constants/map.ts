import { MAPBOX_API_ORIGIN } from '../../../shared/constants/map';

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
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// Mapbox raster tiles (Static Tiles API) of its light and dark styles, one for each theme.
// A tile is 512px, so Leaflet has to shift the zoom by -1.
export const MAP_TILES = {
  BASE_URL: `${MAPBOX_API_ORIGIN}/styles/v1`,
  LIGHT_STYLE: 'mapbox/light-v11',
  DARK_STYLE: 'mapbox/dark-v11',
  TILE_SIZE: 512,
  ZOOM_OFFSET: -1,
} as const;

export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noreferrer">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

// A marker is a 10px dot (route-map.css) inside a 44px touch area.
export const MAP_MARKER_HIT_SIZE = 44;
// Distance from the marker center to the tag above it.
export const MAP_MARKER_TAG_OFFSET = 14;

// The frame of the map in its place in the page; the placeholder of a missing map uses it too.
export const MAP_PLACED_CLASS =
  'absolute inset-0 overflow-hidden rounded-lg border border-border bg-field';

// Class names used by route-map.css
export const MAP_CLASS = {
  MARKER: 'route-marker',
  DOT: 'route-marker__dot',
  DOT_PICKUP: 'route-marker__dot--pickup',
  DOT_DELIVERY: 'route-marker__dot--delivery',
  TAG: 'route-tag',
  LINE: 'route-line',
} as const;

export const MAP_TEXTS = {
  REGION_LABEL: 'Карта города: отметьте точки «Откуда» и «Куда»',
  HINT_PICKUP: 'Отметьте точку «Откуда»',
  HINT_DELIVERY: 'Отметьте точку «Куда»',
  ZOOM_IN: 'Приблизить',
  ZOOM_OUT: 'Отдалить',
  EXPAND: 'Развернуть карту',
  COLLAPSE: 'Свернуть карту',
  REMOVE_POINT: (pointLabel: string) => `Убрать точку «${pointLabel}»`,
  UNAVAILABLE: 'Карта временно недоступна',
  // Shown to a developer only (the dev server), not to a visitor.
  UNAVAILABLE_DEV_HINT: 'Задайте VITE_MAPBOX_TOKEN в файле .env в корне репозитория.',
} as const;
