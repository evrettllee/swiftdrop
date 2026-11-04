import { useRef, useState } from 'react';
import { type ManagerZone, updateManagerZone } from '@/shared/staff-api';
import { showToast } from '@/shared/ui/toast';
import {
  changesOf,
  type DraftErrors,
  draftErrors,
  toZoneFailure,
  type ZoneDraft,
  type ZoneFailure,
} from '@/entities/zone';
import { EDIT_TEXTS } from '../config/texts';

const TOAST_KEY = 'zone-saved';

export function useZoneSave(onSaved: () => void) {
  const inFlight = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [failure, setFailure] = useState<ZoneFailure | null>(null);
  const [errors, setErrors] = useState<DraftErrors>({});

  async function save(zone: ManagerZone, draft: ZoneDraft): Promise<void> {
    const found = draftErrors(draft);
    setErrors(found);

    if (inFlight.current || Object.keys(found).length > 0) {
      return;
    }

    const changes = changesOf(zone, draft);

    if (Object.keys(changes).length === 0) {
      onSaved();

      return;
    }

    inFlight.current = true;
    setIsSaving(true);
    setFailure(null);

    try {
      await updateManagerZone(zone.id, changes, zone.updatedAt);
      showToast({
        key: TOAST_KEY,
        variant: 'success',
        title: EDIT_TEXTS.SAVED,
        text: draft.name.trim(),
      });
      onSaved();
    } catch (error) {
      setFailure(toZoneFailure(error));
    } finally {
      inFlight.current = false;
      setIsSaving(false);
    }
  }

  function reset(): void {
    setFailure(null);
    setErrors({});
  }

  return { isSaving, failure, errors, save, reset };
}
