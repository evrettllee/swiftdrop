import { z } from 'zod';
import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import { VEHICLE_TYPE_VALUES } from '@/common/enums/vehicle-type.enum';
import { csvEnumSchema, unknownParameterError } from '@/common/schemas/list-query.schema';
import {
  CANDIDATE_SORT,
  CANDIDATE_SORT_VALUES,
  MANAGER_ASSIGNMENT_MESSAGES,
} from '../constants/manager-assignment.constants';
import { managerSearchSchema } from './manager-orders.dto';

export const courierCandidatesSchema = z
  .strictObject(
    {
      q: managerSearchSchema.optional(),
      vehicleType: csvEnumSchema(VEHICLE_TYPE_VALUES).optional(),
      sort: z
        .enum(CANDIDATE_SORT_VALUES, { error: MANAGER_ASSIGNMENT_MESSAGES.SORT_INVALID })
        .default(CANDIDATE_SORT.PICKUP_DISTANCE),
    },
    { error: unknownParameterError },
  )
  .transform(({ q, vehicleType, sort }) => ({
    search: q ?? null,
    vehicleTypes: vehicleType ?? null,
    sort,
  }));

export type CourierCandidatesDto = z.infer<typeof courierCandidatesSchema>;

export const assignCourierSchema = z.strictObject(
  {
    courierId: z
      .number({ error: MANAGER_ASSIGNMENT_MESSAGES.COURIER_ID_INVALID })
      .int({ error: MANAGER_ASSIGNMENT_MESSAGES.COURIER_ID_INVALID })
      .positive({ error: MANAGER_ASSIGNMENT_MESSAGES.COURIER_ID_INVALID })
      .max(DB_INTEGER_MAX, { error: MANAGER_ASSIGNMENT_MESSAGES.COURIER_ID_INVALID }),
  },
  { error: unknownParameterError },
);

export type AssignCourierDto = z.infer<typeof assignCourierSchema>;
