import { z } from 'zod';
import { VEHICLE_TYPE, type VehicleType } from '@/shared/api';
import type { ListParamsConfig } from '@/shared/lib/list-params';
import { LIST_VALUES_SEPARATOR, MANAGER_SEARCH_MAX_LENGTH } from '@/shared/staff-api';
import { MAP_FILTER, type MapFilter } from './map';

export type MapParams = {
  state: MapFilter | null;
  vehicleType: readonly VehicleType[];
  q: string | null;
};

export const MAP_PARAMS_CONFIG: ListParamsConfig<MapParams> = {
  schema: z.object({
    state: z.enum(MAP_FILTER),
    vehicleType: z
      .string()
      .transform((raw) => [...new Set(raw.split(LIST_VALUES_SEPARATOR))])
      .pipe(z.array(z.enum(VEHICLE_TYPE)).min(1)),
    q: z.string().trim().min(1).max(MANAGER_SEARCH_MAX_LENGTH),
  }),
  defaults: { state: null, vehicleType: [], q: null },
  searchKey: 'q',
};
