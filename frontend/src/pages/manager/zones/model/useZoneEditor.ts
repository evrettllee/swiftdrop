import { useState } from 'react';
import { useTariffs, useZoneDetails } from '@/entities/zone';
import { useZoneDraft } from './useZoneDraft';
import { useZoneLive } from './useZoneLive';
import { useZoneSave } from './useZoneSave';

type ChangedMark = { zoneId: number; resetCount: number };

export function useZoneEditor(zoneId: number | null, onSaved: () => void) {
  const details = useZoneDetails(zoneId);
  const tariffs = useTariffs(zoneId !== null);
  const [resetCount, setResetCount] = useState(0);
  const [changed, setChanged] = useState<ChangedMark | null>(null);
  const draft = useZoneDraft(details.zone, resetCount);
  const saving = useZoneSave(onSaved);

  useZoneLive(zoneId, () => {
    if (draft.isDirty && zoneId !== null) {
      setChanged({ zoneId, resetCount });
    } else {
      details.reload();
    }
  });

  function refresh(): void {
    saving.reset();
    setChanged(null);
    setResetCount((current) => current + 1);
    details.reload();
  }

  return {
    ...details,
    tariffs,
    draft: draft.draft,
    change: draft.change,
    isDirty: draft.isDirty,
    isChangedElsewhere:
      changed !== null && changed.zoneId === zoneId && changed.resetCount === resetCount,
    saving,
    save: () =>
      details.zone === null || draft.draft === null
        ? Promise.resolve()
        : saving.save(details.zone, draft.draft),
    refresh,
  };
}
