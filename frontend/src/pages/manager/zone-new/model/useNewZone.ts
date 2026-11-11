import { useState } from 'react';
import { useNavigate } from 'react-router';
import { draftErrors, type DraftErrors, priorityOf, useTariffs } from '@/entities/zone';
import { useNeighbors, useOverlapNotes, useShapeSave, useZoneDraw } from '@/features/zone-draw';
import { useLeaveGuard } from '@/shared/lib/navigation';
import { APP_ROUTES } from '@/shared/routes';
import { createManagerZone, type NewZone, type ZonePolygon } from '@/shared/staff-api';
import { showToast } from '@/shared/ui/toast';
import { DEFAULT_PRIORITY, MANAGER_ZONE_NEW_TEXTS as TEXTS } from '../config/texts';

export type NewZoneParams = {
  name: string;
  tariffId: number | null;
  priority: string;
  isActive: boolean;
};

const INITIAL: NewZoneParams = {
  name: '',
  tariffId: null,
  priority: DEFAULT_PRIORITY,
  isActive: true,
};
const TOAST_KEY = 'zone-created';

function newZoneOf(params: NewZoneParams, tariffId: number, polygon: ZonePolygon): NewZone {
  return {
    name: params.name.trim(),
    polygon,
    tariffId,
    priority: priorityOf(params.priority) ?? 0,
    isActive: params.isActive,
  };
}

function isParamsChanged(params: NewZoneParams): boolean {
  return JSON.stringify(params) !== JSON.stringify(INITIAL);
}

export function useNewZone() {
  const navigate = useNavigate();
  const draw = useZoneDraw();
  const tariffs = useTariffs(true);
  const neighbors = useNeighbors(null);
  const saving = useShapeSave();
  const [params, setParams] = useState<NewZoneParams>(INITIAL);
  const [errors, setErrors] = useState<DraftErrors>({});
  const tariffId = params.tariffId ?? tariffs[0]?.id ?? null;
  const guard = useLeaveGuard(
    draw.state.shape !== null || draw.state.isDrawing || isParamsChanged(params),
  );
  const priority = priorityOf(params.priority) ?? 0;
  const notes = useOverlapNotes(draw.points, null, priority, neighbors.neighbors);

  async function save(): Promise<void> {
    const found = draftErrors({ ...params, tariffId: tariffId ?? 0 });
    setErrors(found);

    await saving.save(
      draw.points,
      Object.keys(found).length === 0 && tariffId !== null,
      async (polygon) => {
        const zone = await createManagerZone(newZoneOf(params, tariffId ?? 0, polygon));
        showToast({ key: TOAST_KEY, variant: 'success', title: TEXTS.CREATED, text: zone.name });
        guard.release();
        void navigate(APP_ROUTES.MANAGER_ZONES, { state: { selectedZoneId: zone.id } });
      },
    );
  }

  return {
    draw,
    tariffs,
    neighbors,
    saving,
    params,
    tariffId,
    errors,
    notes,
    guard,
    change: (patch: Partial<NewZoneParams>) => setParams((current) => ({ ...current, ...patch })),
    save,
    cancel: () => void navigate(APP_ROUTES.MANAGER_ZONES),
  };
}
