import { z } from 'zod';
import { http, VEHICLE_TYPE } from '@/shared/api';

export const MANAGER_COURIERS_API_PATHS = {
  LOOKUP: '/manager/couriers/lookup',
} as const;

export const COURIER_LOOKUP_PARAM = {
  SEARCH: 'q',
  LIMIT: 'limit',
} as const;

export const COURIER_LOOKUP_LIMIT = 10;

export const courierLookupItemSchema = z.object({
  courierId: z.number(),
  name: z.string(),
  vehicleType: z.enum(VEHICLE_TYPE).nullable(),
});

export type CourierLookupItem = z.infer<typeof courierLookupItemSchema>;

export async function lookupCouriers(
  search: string,
  signal?: AbortSignal,
): Promise<CourierLookupItem[]> {
  const query = new URLSearchParams({
    [COURIER_LOOKUP_PARAM.SEARCH]: search,
    [COURIER_LOOKUP_PARAM.LIMIT]: String(COURIER_LOOKUP_LIMIT),
  });

  return z
    .array(courierLookupItemSchema)
    .parse(await http.get(`${MANAGER_COURIERS_API_PATHS.LOOKUP}?${query.toString()}`, { signal }));
}
