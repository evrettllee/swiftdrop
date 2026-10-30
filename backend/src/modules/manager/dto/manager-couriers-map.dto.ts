import { z } from 'zod';
import { VEHICLE_TYPE_VALUES } from '@/common/enums/vehicle-type.enum';
import { csvEnumSchema, unknownParameterError } from '@/common/schemas/list-query.schema';
import { COURIER_MAP_STATE_VALUES } from '../constants/manager-couriers-map.constants';
import { managerSearchSchema } from './manager-orders.dto';

export const couriersMapSchema = z
  .strictObject(
    {
      state: csvEnumSchema(COURIER_MAP_STATE_VALUES).optional(),
      vehicleType: csvEnumSchema(VEHICLE_TYPE_VALUES).optional(),
      q: managerSearchSchema.optional(),
    },
    { error: unknownParameterError },
  )
  .transform(({ state, vehicleType, q }) => ({
    states: state ?? null,
    vehicleTypes: vehicleType ?? null,
    search: q ?? null,
  }));

export type CouriersMapDto = z.infer<typeof couriersMapSchema>;
