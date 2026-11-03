import type { LatLngTuple } from 'leaflet';
import { useMemo } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import { joinClassNames } from '@/shared/lib/class-names';
import type { GeoPoint } from '@/shared/lib/geo';
import { toLatLng } from './lat-lng';
import { MAP_CLASS } from './map';

const ZONE_LABEL_OFFSET: [number, number] = [0, 8];

function topPoint(ring: readonly GeoPoint[]): GeoPoint | null {
  return ring.reduce<GeoPoint | null>(
    (top, point) => (top === null || point.latitude > top.latitude ? point : top),
    null,
  );
}

type ZonePolygonProps = {
  ring: readonly GeoPoint[];
  label: string;
  isActive: boolean;
  isSelected: boolean;
  onSelect: () => void;
};

export function ZonePolygon({ ring, label, isActive, isSelected, onSelect }: ZonePolygonProps) {
  const positions = useMemo<LatLngTuple[]>(() => ring.map(toLatLng), [ring]);
  const labelPoint = useMemo(() => topPoint(ring), [ring]);
  const className = joinClassNames(
    MAP_CLASS.ZONE,
    isSelected ? MAP_CLASS.ZONE_SELECTED : '',
    isActive ? '' : MAP_CLASS.ZONE_OFF,
  );
  const eventHandlers = useMemo(() => ({ click: onSelect }), [onSelect]);

  return (
    <Polygon
      key={className}
      positions={positions}
      pathOptions={{ className }}
      eventHandlers={eventHandlers}
    >
      {labelPoint === null ? null : (
        <Tooltip
          position={toLatLng(labelPoint)}
          permanent
          direction="bottom"
          offset={ZONE_LABEL_OFFSET}
          className={joinClassNames(MAP_CLASS.ZONE_LABEL, isActive ? '' : MAP_CLASS.ZONE_OFF)}
        >
          {label}
        </Tooltip>
      )}
    </Polygon>
  );
}
