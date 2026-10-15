import { lazy, Suspense } from 'react';
import type { GeoPoint } from '@/shared/lib/geo';
import { Skeleton } from '@/shared/ui/skeleton';

// Leaflet comes with the map only when the courier is on the line: the page without the line does
// not load it at all.
const PositionMap = lazy(() =>
  import('@/shared/ui/route-map').then((module) => ({ default: module.PositionMap })),
);

// The size of the map block, the same for the map and for its placeholder.
const MAP_FRAME_CLASS = 'h-41 lg:h-70';

type CourierLocationMapProps = {
  // Null until the backend took the first position.
  point: GeoPoint | null;
};

export function CourierLocationMap({ point }: CourierLocationMapProps) {
  const placeholder = <Skeleton className={`${MAP_FRAME_CLASS} rounded-lg`} />;

  return point === null ? (
    placeholder
  ) : (
    <Suspense fallback={placeholder}>
      <PositionMap point={point} className={MAP_FRAME_CLASS} />
    </Suspense>
  );
}
