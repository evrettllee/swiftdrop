import { useState } from 'react';
import type { ManagerZone } from '@/shared/staff-api';
import { draftOf, isDraftChanged, zoneCacheKey, type ZoneDraft } from '@/entities/zone';

type StoredDraft = { key: string; draft: ZoneDraft };

export function useZoneDraft(zone: ManagerZone | null, resetCount: number) {
  const key = zone === null ? '' : `${zoneCacheKey(zone)}:${resetCount}`;
  const [stored, setStored] = useState<StoredDraft | null>(null);
  const draft = zone === null ? null : stored?.key === key ? stored.draft : draftOf(zone);

  function change(patch: Partial<ZoneDraft>): void {
    if (draft !== null) {
      setStored({ key, draft: { ...draft, ...patch } });
    }
  }

  return {
    draft,
    change,
    isDirty: zone !== null && draft !== null && isDraftChanged(zone, draft),
  };
}
