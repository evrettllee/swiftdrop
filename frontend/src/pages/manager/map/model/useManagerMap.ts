import { useMemo } from 'react';
import { useListParams } from '@/shared/lib/list-params';
import { type CouriersMapQuery, isSearchUsable } from '@/shared/staff-api';
import { MAP_PARAMS_CONFIG } from '../config/map-params';
import { pointOf, statesOf } from '../lib/courier-state';
import { useCouriersMap } from './useCouriersMap';
import { useLiveCouriers } from './useLiveCouriers';
import { useSelectedCourier } from './useSelectedCourier';

export function useManagerMap() {
  const params = useListParams(MAP_PARAMS_CONFIG);
  const { state, vehicleType, q } = params.values;
  const query = useMemo<CouriersMapQuery>(
    () => ({
      states: statesOf(state),
      vehicleTypes: vehicleType.length === 0 ? null : vehicleType,
      search: q !== null && isSearchUsable(q) ? q : null,
    }),
    [state, vehicleType, q],
  );
  const map = useCouriersMap(query);
  const live = useLiveCouriers(map.answer, state);
  const { selectedId, select } = useSelectedCourier();
  const selected = live.shown.find(({ courierId }) => courierId === selectedId) ?? null;

  return {
    ...live,
    params,
    query,
    isLoading: map.isLoading,
    isFailed: map.answer?.isFailed === true,
    hasData: (map.answer?.data ?? null) !== null,
    reload: map.reload,
    selected,
    selectedPoint: pointOf(selected),
    selectedId,
    select,
  };
}
