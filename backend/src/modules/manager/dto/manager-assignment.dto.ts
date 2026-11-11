import { z } from 'zod';
import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import { ORDER_STATUS_HISTORY_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';
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

const courierIdSchema = z
  .number({ error: MANAGER_ASSIGNMENT_MESSAGES.COURIER_ID_INVALID })
  .int({ error: MANAGER_ASSIGNMENT_MESSAGES.COURIER_ID_INVALID })
  .positive({ error: MANAGER_ASSIGNMENT_MESSAGES.COURIER_ID_INVALID })
  .max(DB_INTEGER_MAX, { error: MANAGER_ASSIGNMENT_MESSAGES.COURIER_ID_INVALID });

const expectedCourierIdSchema = z
  .number({ error: MANAGER_ASSIGNMENT_MESSAGES.EXPECTED_COURIER_INVALID })
  .int({ error: MANAGER_ASSIGNMENT_MESSAGES.EXPECTED_COURIER_INVALID })
  .positive({ error: MANAGER_ASSIGNMENT_MESSAGES.EXPECTED_COURIER_INVALID })
  .max(DB_INTEGER_MAX, { error: MANAGER_ASSIGNMENT_MESSAGES.EXPECTED_COURIER_INVALID })
  .nullable();

export const reasonSchema = z
  .string({ error: MANAGER_ASSIGNMENT_MESSAGES.REASON_INVALID })
  .trim()
  .min(1, { error: MANAGER_ASSIGNMENT_MESSAGES.REASON_INVALID })
  .max(ORDER_STATUS_HISTORY_FIELD_LENGTH.COMMENT, {
    error: MANAGER_ASSIGNMENT_MESSAGES.REASON_INVALID,
  });

export const assignCourierSchema = z.strictObject(
  { courierId: courierIdSchema },
  { error: unknownParameterError },
);

export type AssignCourierDto = z.infer<typeof assignCourierSchema>;

export const reassignCourierSchema = z
  .strictObject(
    {
      courierId: courierIdSchema,
      expectedCourierId: expectedCourierIdSchema,
      reason: reasonSchema.optional(),
    },
    { error: unknownParameterError },
  )
  .transform(({ courierId, expectedCourierId, reason }) => ({
    courierId,
    expectedCourierId,
    reason: reason ?? null,
  }));

export type ReassignCourierDto = z.infer<typeof reassignCourierSchema>;

export const restartAssignmentSchema = z.preprocess(
  (body) => body ?? {},
  z
    .strictObject(
      { expectedCourierId: expectedCourierIdSchema, reason: reasonSchema.optional() },
      { error: unknownParameterError },
    )
    .transform(({ expectedCourierId, reason }) => ({ expectedCourierId, reason: reason ?? null })),
);

export type RestartAssignmentDto = z.infer<typeof restartAssignmentSchema>;
