import { lazy, Suspense } from 'react';
import { MAP_FRAME_CLASS } from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';
import { Skeleton } from '@/shared/ui/skeleton';

// Leaflet comes with the map only when the courier is on the line: the page without the line does
// not load it at all.
const PositionMap = lazy(() =>
  import('@/shared/ui/route-map').then((module) => ({ default: module.PositionMap })),
);

type CourierLocationMapProps = {
  // Null until the backend took the first position.
  point: GeoPoint | null;
  // Orders are searched for: the connection is up.
  isSearching: boolean;
};

export function CourierLocationMap({ point, isSearching }: CourierLocationMapProps) {
  const placeholder = <Skeleton className={`${MAP_FRAME_CLASS} rounded-lg`} />;

  return point === null ? (
    placeholder
  ) : (
    <Suspense fallback={placeholder}>
      <PositionMap point={point} isPulsing={isSearching} className={MAP_FRAME_CLASS} />
    </Suspense>
  );
}
