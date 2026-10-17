import type { ControlPosition } from 'leaflet';
import { AttributionControl, TileLayer } from 'react-leaflet';
import { MAPBOX_TOKEN, MAPBOX_TOKEN_PARAM } from '@/shared/config';
import { THEME, useThemeStore } from '@/shared/lib/theme';
import { MAP_ATTRIBUTION, MAP_ATTRIBUTION_POSITION, MAP_TILES } from './map';

// {z}, {x}, {y} and {r} (the retina suffix) are filled in by Leaflet.
function buildTileUrl(style: string): string {
  return `${MAP_TILES.BASE_URL}/${style}/tiles/${MAP_TILES.TILE_SIZE}/{z}/{x}/{y}{r}?${MAPBOX_TOKEN_PARAM}=${MAPBOX_TOKEN}`;
}

type MapTilesProps = {
  attributionPosition?: ControlPosition;
};

export function MapTiles({ attributionPosition = MAP_ATTRIBUTION_POSITION.PLACED }: MapTilesProps) {
  const theme = useThemeStore((state) => state.theme);
  const tileUrl = buildTileUrl(theme === THEME.DARK ? MAP_TILES.DARK_STYLE : MAP_TILES.LIGHT_STYLE);

  return (
    <>
      {/* The key reloads the tiles when the theme changes. */}
      <TileLayer
        key={tileUrl}
        url={tileUrl}
        tileSize={MAP_TILES.TILE_SIZE}
        zoomOffset={MAP_TILES.ZOOM_OFFSET}
        attribution={MAP_ATTRIBUTION}
      />
      <AttributionControl position={attributionPosition} prefix={false} />
    </>
  );
}
