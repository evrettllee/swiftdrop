import { z } from 'zod';
import {
  type ClientOrderRoute,
  clientOrderRouteSchema,
  dateSchema,
  http,
  type HttpOptions,
  orderStatusSchema,
  VEHICLE_TYPE,
} from '@/shared/api';
import {
  ORDER_ACTOR,
  ORDER_OFFER_STATUS,
  TICKET_AUTHOR,
  TICKET_TOPIC,
} from './manager-order-params';
import { MANAGER_ORDERS_API_PATHS } from './manager-orders';
import { PAYMENT_STATE } from './manager-orders-params';
import { SUPPORT_TICKET_STATUS } from './support';

const addressSchema = z.object({
  city: z.string(),
  street: z.string(),
  house: z.string(),
  apartment: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
});

const vehicleTypeSchema = z.enum(VEHICLE_TYPE);

export const managerOrderDetailsSchema = z.object({
  id: z.number(),
  status: orderStatusSchema,
  createdAt: dateSchema,
  statusChangedAt: dateSchema,
  finishedAt: dateSchema.nullable(),
  estimatedDeliveryAt: dateSchema.nullable(),
  client: z.object({
    id: z.number(),
    name: z.string(),
    phone: z.string().nullable(),
    email: z.string(),
  }),
  courier: z
    .object({
      id: z.number(),
      name: z.string(),
      phone: z.string().nullable(),
      vehicle: z
        .object({
          type: vehicleTypeSchema,
          brand: z.string().nullable(),
          model: z.string().nullable(),
          plate: z.string().nullable(),
        })
        .nullable(),
    })
    .nullable(),
  recipient: z.object({ name: z.string(), phone: z.string() }),
  route: z.object({ from: addressSchema, to: addressSchema }),
  parcel: z.object({
    weight: z.number(),
    length: z.number(),
    width: z.number(),
    height: z.number(),
    fragile: z.boolean(),
  }),
  pricing: z.object({
    price: z.number(),
    coefficient: z.number(),
    distanceKm: z.number(),
    estimatedMinutes: z.number().nullable(),
    tariffName: z.string(),
  }),
  payment: z.object({
    state: z.enum(PAYMENT_STATE),
    paidAt: dateSchema.nullable(),
    refundedAt: dateSchema.nullable(),
  }),
  history: z.array(
    z.object({
      status: orderStatusSchema,
      changedAt: dateSchema,
      actor: z.enum(ORDER_ACTOR),
      actorName: z.string().nullable(),
      comment: z.string().nullable(),
    }),
  ),
  offers: z.array(
    z.object({
      round: z.number(),
      courier: z.object({
        id: z.number(),
        name: z.string(),
        vehicleType: vehicleTypeSchema.nullable(),
      }),
      status: z.enum(ORDER_OFFER_STATUS),
      pickupEtaSec: z.number(),
      offeredAt: dateSchema,
      respondedAt: dateSchema.nullable(),
    }),
  ),
  tickets: z.array(
    z.object({
      id: z.number(),
      topic: z.enum(TICKET_TOPIC),
      subject: z.string().nullable(),
      status: z.enum(SUPPORT_TICKET_STATUS),
      awaitingStaff: z.boolean(),
      lastMessageAt: dateSchema,
      author: z.enum(TICKET_AUTHOR),
    }),
  ),
  actions: z.object({
    canAssign: z.boolean(),
    canReassign: z.boolean(),
    canRestartAutoAssign: z.boolean(),
    canCancel: z.boolean(),
  }),
});

export type ManagerOrderDetails = z.infer<typeof managerOrderDetailsSchema>;
export type ManagerOrderHistoryEntry = ManagerOrderDetails['history'][number];
export type ManagerOrderOffer = ManagerOrderDetails['offers'][number];
export type ManagerOrderTicket = ManagerOrderDetails['tickets'][number];
export type ManagerOrderCourier = NonNullable<ManagerOrderDetails['courier']>;
export type ManagerOrderActions = ManagerOrderDetails['actions'];

export function managerOrderPath(orderId: number): string {
  return `${MANAGER_ORDERS_API_PATHS.ORDERS}/${orderId}`;
}

export async function getManagerOrder(
  orderId: number,
  options: HttpOptions = {},
): Promise<ManagerOrderDetails> {
  return managerOrderDetailsSchema.parse(await http.get(managerOrderPath(orderId), options));
}

export async function getManagerOrderRoute(
  orderId: number,
  options: HttpOptions = {},
): Promise<ClientOrderRoute> {
  return clientOrderRouteSchema.parse(
    await http.get(`${managerOrderPath(orderId)}/route`, options),
  );
}
