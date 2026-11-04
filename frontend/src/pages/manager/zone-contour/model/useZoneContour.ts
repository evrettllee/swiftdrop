import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { toLatLngs, toRing, useZoneDetails } from '@/entities/zone';
import {
  type DrawShape,
  sameShape,
  SHAPE_KIND,
  useNeighbors,
  useOverlapNotes,
  useShapeSave,
  useZoneDraw,
  type ZoneDraw,
} from '@/features/zone-draw';
import type { GeoPoint } from '@/shared/lib/geo';
import { useLeaveGuard } from '@/shared/lib/navigation';
import { APP_ROUTES } from '@/shared/routes';
import { type ManagerZoneDetails, updateManagerZone } from '@/shared/staff-api';
import { showToast } from '@/shared/ui/toast';
import { MANAGER_ZONE_CONTOUR_TEXTS as TEXTS } from '../config/texts';

const TOAST_KEY = 'zone-contour-saved';
const NO_RING: readonly GeoPoint[] = [];

function useInitialShape(zone: ManagerZoneDetails | null, controller: ZoneDraw['controller']) {
  const ring = useMemo(() => (zone === null ? NO_RING : toRing(zone.polygon)), [zone]);
  const initial = useMemo<DrawShape | null>(
    () => (zone === null ? null : { kind: SHAPE_KIND.RING, points: toLatLngs(ring) }),
    [zone, ring],
  );

  useEffect(() => {
    if (initial !== null) {
      controller.reset(initial);
    }
  }, [initial, controller]);

  return { ring, initial };
}

export function useZoneContour(zoneId: number | null) {
  const navigate = useNavigate();
  const details = useZoneDetails(zoneId);
  const { zone } = details;
  const draw = useZoneDraw();
  const neighbors = useNeighbors(zoneId);
  const saving = useShapeSave();
  const { ring, initial } = useInitialShape(zone, draw.controller);
  const isChanged =
    initial !== null && (draw.state.isDrawing || !sameShape(draw.state.shape, initial));
  const guard = useLeaveGuard(isChanged);
  const notes = useOverlapNotes(
    draw.points,
    zone?.id ?? null,
    zone?.priority ?? 0,
    neighbors.neighbors,
  );
  async function save(): Promise<void> {
    if (zone === null) {
      return;
    }

    await saving.save(draw.points, true, async (polygon) => {
      await updateManagerZone(zone.id, { polygon }, zone.updatedAt);
      showToast({ key: TOAST_KEY, variant: 'success', title: TEXTS.SAVED, text: zone.name });
      guard.release();
      void navigate(APP_ROUTES.MANAGER_ZONES, { state: { selectedZoneId: zone.id } });
    });
  }

  return {
    details,
    zone,
    ring,
    initial,
    draw,
    neighbors,
    saving,
    notes,
    guard,
    save,
    refresh: () => {
      saving.reset();
      details.reload();
    },
    cancel: () => void navigate(APP_ROUTES.MANAGER_ZONES),
  };
}
