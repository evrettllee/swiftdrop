import { z } from 'zod';
import { dateSchema, http, orderStatusSchema, VEHICLE_TYPE, type VehicleType } from '@/shared/api';
import { LIST_VALUES_SEPARATOR } from './manager-orders-params';

export const COURIERS_MAP_API_PATH = '/manager/couriers/map';

export const COURIERS_MAP_PARAM = {
  STATE: 'state',
  VEHICLE_TYPE: 'vehicleType',
  SEARCH: 'q',
} as const;

export const COURIER_MAP_STATE = {
  FREE: 'free',
  ON_ORDER: 'on_order',
  OFFER: 'offer',
  NO_SIGNAL: 'no_signal',
} as const;

export type CourierMapState = (typeof COURIER_MAP_STATE)[keyof typeof COURIER_MAP_STATE];

const courierMapStateSchema = z.enum(COURIER_MAP_STATE);

export const courierMapItemSchema = z.object({
  courierId: z.number(),
  name: z.string(),
  phone: z.string().nullable(),
  vehicleType: z.enum(VEHICLE_TYPE).nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  positionAt: dateSchema.nullable(),
  positionAgeSec: z.number().nullable(),
  state: courierMapStateSchema,
  activeOrder: z.object({ orderId: z.number(), status: orderStatusSchema }).nullable(),
  openOfferOrderId: z.number().nullable(),
});

export type CourierMapItem = z.infer<typeof courierMapItemSchema>;

export const couriersMapSchema = z.object({
  items: z.array(courierMapItemSchema),
  counts: z.record(courierMapStateSchema, z.number()),
});

export type CouriersMap = z.infer<typeof couriersMapSchema>;

export type CouriersMapQuery = {
  states: readonly CourierMapState[] | null;
  vehicleTypes: readonly VehicleType[] | null;
  search: string | null;
};

function toSearchParams({ states, vehicleTypes, search }: CouriersMapQuery): URLSearchParams {
  const query = new URLSearchParams();

  if (states !== null && states.length > 0) {
    query.set(COURIERS_MAP_PARAM.STATE, states.join(LIST_VALUES_SEPARATOR));
  }

  if (vehicleTypes !== null && vehicleTypes.length > 0) {
    query.set(COURIERS_MAP_PARAM.VEHICLE_TYPE, vehicleTypes.join(LIST_VALUES_SEPARATOR));
  }

  if (search !== null) {
    query.set(COURIERS_MAP_PARAM.SEARCH, search);
  }

  return query;
}

export async function getCouriersMap(
  request: CouriersMapQuery,
  signal?: AbortSignal,
): Promise<CouriersMap> {
  const query = toSearchParams(request).toString();
  const path = query === '' ? COURIERS_MAP_API_PATH : `${COURIERS_MAP_API_PATH}?${query}`;

  return couriersMapSchema.parse(await http.get(path, { signal }));
}
