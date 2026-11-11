import { z } from 'zod';
import { http, orderStatusSchema, VEHICLE_TYPE } from '@/shared/api';
import {
  ACTION_CONFLICT,
  type ActionConflict,
  type CandidateSort,
  ORDER_REFUND,
  UNSUITABLE_REASON,
  type UnsuitableReason,
} from './manager-actions-params';
import { managerOrderPath } from './manager-order';
import { setIf } from './manager-orders';

const candidateSchema = z.object({
  courierId: z.number(),
  name: z.string(),
  vehicleType: z.enum(VEHICLE_TYPE).nullable(),
  pickupDistanceM: z.number().nullable(),
  positionAgeSec: z.number().nullable(),
  hasOpenOffer: z.boolean(),
});

export const courierCandidatesSchema = z.object({
  suitable: z.array(candidateSchema),
  unsuitable: z.array(candidateSchema.extend({ reasons: z.array(z.enum(UNSUITABLE_REASON)) })),
});

export type CourierCandidates = z.infer<typeof courierCandidatesSchema>;
export type CourierCandidate = z.infer<typeof candidateSchema>;
export type UnsuitableCandidate = CourierCandidates['unsuitable'][number];

const assignedSchema = z.object({ orderId: z.number(), courierId: z.number() });
const restartedSchema = z.object({ orderId: z.number(), status: orderStatusSchema });
const cancelledSchema = z.object({
  orderId: z.number(),
  status: orderStatusSchema,
  refund: z.enum(ORDER_REFUND),
});

export type CancelledOrder = z.infer<typeof cancelledSchema>;

const conflictBodySchema = z.object({
  code: z.enum(ACTION_CONFLICT),
  reason: z.enum(UNSUITABLE_REASON).optional(),
});

export type ActionConflictBody = { code: ActionConflict; reason: UnsuitableReason | null };

export function readActionConflict(body: unknown): ActionConflictBody | null {
  const parsed = conflictBodySchema.safeParse(body);

  return parsed.success ? { code: parsed.data.code, reason: parsed.data.reason ?? null } : null;
}

export type CandidatesQuery = { search: string | null; sort: CandidateSort };

export async function getCourierCandidates(
  orderId: number,
  { search, sort }: CandidatesQuery,
  signal?: AbortSignal,
): Promise<CourierCandidates> {
  const query = new URLSearchParams();
  setIf(query, 'q', search);
  query.set('sort', sort);

  return courierCandidatesSchema.parse(
    await http.get(`${managerOrderPath(orderId)}/candidates?${query.toString()}`, { signal }),
  );
}

export async function assignCourier(orderId: number, courierId: number) {
  return assignedSchema.parse(
    await http.post(`${managerOrderPath(orderId)}/assign`, { courierId }),
  );
}

export type ReassignRequest = {
  courierId: number;
  expectedCourierId: number | null;
  reason: string | null;
};

export async function reassignCourier(orderId: number, request: ReassignRequest) {
  const { reason, ...rest } = request;

  return assignedSchema.parse(
    await http.post(`${managerOrderPath(orderId)}/reassign`, reason === null ? rest : request),
  );
}

export async function restartAssignment(
  orderId: number,
  expectedCourierId: number | null,
  reason: string | null,
) {
  const body = reason === null ? { expectedCourierId } : { expectedCourierId, reason };

  return restartedSchema.parse(
    await http.post(`${managerOrderPath(orderId)}/restart-assignment`, body),
  );
}

export async function cancelManagerOrder(orderId: number, reason: string): Promise<CancelledOrder> {
  return cancelledSchema.parse(await http.post(`${managerOrderPath(orderId)}/cancel`, { reason }));
}
