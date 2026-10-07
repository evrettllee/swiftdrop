import { AttributionControl, TileLayer } from 'react-leaflet';
import { MAPBOX_TOKEN } from '../../../../shared/config';
import { MAPBOX_TOKEN_PARAM } from '../../../../shared/constants/map';
import { THEME } from '../../../../shared/theme/constants';
import { useThemeStore } from '../../../../shared/theme/store';
import { MAP_ATTRIBUTION, MAP_TILES } from '../../constants/map';

// {z}, {x}, {y} and {r} (the retina suffix) are filled in by Leaflet.
function buildTileUrl(style: string): string {
  return `${MAP_TILES.BASE_URL}/${style}/tiles/${MAP_TILES.TILE_SIZE}/{z}/{x}/{y}{r}?${MAPBOX_TOKEN_PARAM}=${MAPBOX_TOKEN}`;
}

export function MapTiles() {
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
      <AttributionControl position="bottomright" prefix={false} />
    </>
  );
}
