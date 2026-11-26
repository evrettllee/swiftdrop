import { useEffect, useState } from 'react';
import type { VehicleType } from '@/shared/api';
import { LIST_SEARCH_DEBOUNCE_MS } from '@/shared/lib/list-params';
import { getCouriersMap } from '@/shared/staff-api';
import type { MapFilter } from '../config/map';
import { countForFilter, statesOf } from '../lib/courier-state';
import { toggleVehicleType } from '../lib/vehicle';

type CountAnswer = { key: string; count: number };

type UseVehicleDraftOptions = {
  selected: readonly VehicleType[];
  state: MapFilter | null;
  search: string | null;
  committedCount: number | null;
};

function draftKeyOf(
  vehicleTypes: readonly VehicleType[],
  state: MapFilter | null,
  search: string | null,
): string {
  return JSON.stringify([vehicleTypes, state, search]);
}

export function useVehicleDraft({
  selected,
  state,
  search,
  committedCount,
}: UseVehicleDraftOptions) {
  const [draft, setDraft] = useState<VehicleType[]>(() => [...selected]);
  const [answer, setAnswer] = useState<CountAnswer | null>(null);
  const key = draftKeyOf(draft, state, search);
  const isCommitted = key === draftKeyOf(selected, state, search) && committedCount !== null;

  useEffect(() => {
    if (isCommitted) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      getCouriersMap(
        {
          states: statesOf(state),
          vehicleTypes: draft.length === 0 ? null : draft,
          search,
        },
        controller.signal,
      ).then(
        (data) => {
          if (!controller.signal.aborted) {
            setAnswer({ key, count: countForFilter(data.counts, state) });
          }
        },
        () => undefined,
      );
    }, LIST_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [draft, state, search, key, isCommitted]);

  const count = isCommitted ? committedCount : answer?.key === key ? answer.count : null;

  return {
    draft,
    count,
    toggle: (vehicleType: VehicleType) =>
      setDraft((current) => toggleVehicleType(current, vehicleType)),
    reset: () => setDraft([]),
  };
}
