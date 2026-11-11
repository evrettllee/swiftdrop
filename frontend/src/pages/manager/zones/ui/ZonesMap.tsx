import { useMemo } from 'react';
import type { GeoPoint } from '@/shared/lib/geo';
import type { ManagerZone } from '@/shared/staff-api';
import { AREAS_FIT_PADDING, MarkersMap, ZonePolygon } from '@/shared/ui/route-map';
import { type PolygonCache, ringOf } from '@/entities/zone';
import { MANAGER_ZONES_TEXTS as TEXTS } from '../config/texts';

const NO_POINTS: readonly GeoPoint[] = [];

type ZonesMapProps = {
  zones: readonly ManagerZone[];
  cache: PolygonCache;
  isSettled: boolean;
  selectedId: number | null;
  onSelect: (zoneId: number) => void;
};

export function ZonesMap({ zones, cache, isSettled, selectedId, onSelect }: ZonesMapProps) {
  const fitPoints = useMemo(
    () => (isSettled ? zones.flatMap((zone) => ringOf(zone, cache) ?? []) : NO_POINTS),
    [zones, cache, isSettled],
  );

  return (
    <MarkersMap
      label={TEXTS.MAP_LABEL}
      fitPoints={fitPoints}
      fitPadding={AREAS_FIT_PADDING}
      className="h-55 lg:h-90"
    >
      {zones.map((zone) => {
        const ring = ringOf(zone, cache);

        return ring === null ? null : (
          <ZonePolygon
            key={zone.id}
            ring={ring}
            label={zone.name}
            isActive={zone.isActive}
            isSelected={zone.id === selectedId}
            onSelect={() => onSelect(zone.id)}
          />
        );
      })}
    </MarkersMap>
  );
}
