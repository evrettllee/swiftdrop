import { useMemo } from 'react';
import { type LatLngLike, type Neighbor, type OverlapNote, overlapNotes } from '@/entities/zone';

export function useOverlapNotes(
  points: readonly LatLngLike[],
  id: number | null,
  priority: number,
  neighbors: readonly Neighbor[],
): OverlapNote[] {
  return useMemo(
    () =>
      overlapNotes(
        points.map(({ lat, lng }) => ({ latitude: lat, longitude: lng })),
        { id, priority },
        neighbors,
      ),
    [points, id, priority, neighbors],
  );
}
