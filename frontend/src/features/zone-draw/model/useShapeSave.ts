import { useRef, useState } from 'react';
import {
  checkZonePolygon,
  type LatLngLike,
  POLYGON_ERROR_TEXTS,
  toZoneFailure,
  toZonePolygon,
  ZONE_FAILURE,
  type ZoneFailure,
} from '@/entities/zone';
import type { ZonePolygon } from '@/shared/staff-api';

export function useShapeSave() {
  const inFlight = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [failure, setFailure] = useState<ZoneFailure | null>(null);
  const [polygonError, setPolygonError] = useState<string | null>(null);

  async function save(
    points: readonly LatLngLike[],
    isValid: boolean,
    write: (polygon: ZonePolygon) => Promise<void>,
  ): Promise<void> {
    const polygon = toZonePolygon(points);
    const reason = checkZonePolygon(polygon);
    setPolygonError(reason === null ? null : POLYGON_ERROR_TEXTS[reason]);

    if (reason !== null || !isValid || inFlight.current) {
      return;
    }

    inFlight.current = true;
    setIsSaving(true);
    setFailure(null);

    try {
      await write(polygon);
    } catch (error) {
      const next = toZoneFailure(error);

      if (next.kind === ZONE_FAILURE.POLYGON) {
        setPolygonError(next.title);
      } else {
        setFailure(next);
      }
    } finally {
      inFlight.current = false;
      setIsSaving(false);
    }
  }

  function reset(): void {
    setFailure(null);
    setPolygonError(null);
  }

  return { isSaving, failure, polygonError, save, reset };
}
