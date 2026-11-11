import { z } from 'zod';
import { ORDER_OFFER_STATUS_VALUES } from '@/common/enums/order-offer-status.enum';
import { ORDER_STATUS_VALUES } from '@/common/enums/order-status.enum';
import {
  SUPPORT_TICKET_STATUS_VALUES,
  TICKET_TOPIC_VALUES,
} from '@/common/enums/support-ticket.enum';
import { VEHICLE_TYPE_VALUES } from '@/common/enums/vehicle-type.enum';
import {
  ORDER_ACTOR_VALUES,
  PAYMENT_STATE_VALUES,
  TICKET_AUTHOR_VALUES,
} from '../constants/manager-orders.constants';

const addressSchema = z.strictObject({
  city: z.string(),
  street: z.string(),
  house: z.string(),
  apartment: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
});

const courierSchema = z.strictObject({
  id: z.number().int(),
  name: z.string(),
  phone: z.string().nullable(),
  vehicle: z
    .strictObject({
      type: z.enum(VEHICLE_TYPE_VALUES),
      brand: z.string().nullable(),
      model: z.string().nullable(),
      plate: z.string().nullable(),
    })
    .nullable(),
});

const historyEntrySchema = z.strictObject({
  status: z.enum(ORDER_STATUS_VALUES),
  changedAt: z.date(),
  actor: z.enum(ORDER_ACTOR_VALUES),
  actorName: z.string().nullable(),
  comment: z.string().nullable(),
});

const offerSchema = z.strictObject({
  round: z.number().int(),
  courier: z.strictObject({
    id: z.number().int(),
    name: z.string(),
    vehicleType: z.enum(VEHICLE_TYPE_VALUES).nullable(),
  }),
  status: z.enum(ORDER_OFFER_STATUS_VALUES),
  pickupEtaSec: z.number().int(),
  offeredAt: z.date(),
  respondedAt: z.date().nullable(),
});

const ticketSchema = z.strictObject({
  id: z.number().int(),
  topic: z.enum(TICKET_TOPIC_VALUES),
  subject: z.string().nullable(),
  status: z.enum(SUPPORT_TICKET_STATUS_VALUES),
  awaitingStaff: z.boolean(),
  lastMessageAt: z.date(),
  author: z.enum(TICKET_AUTHOR_VALUES),
});

export const managerOrderPaymentSchema = z.strictObject({
  state: z.enum(PAYMENT_STATE_VALUES),
  paidAt: z.date().nullable(),
  refundedAt: z.date().nullable(),
});

export const managerOrderActionsSchema = z.strictObject({
  canAssign: z.boolean(),
  canReassign: z.boolean(),
  canRestartAutoAssign: z.boolean(),
  canCancel: z.boolean(),
});

export const managerOrderDetailsSchema = z.strictObject({
  id: z.number().int(),
  status: z.enum(ORDER_STATUS_VALUES),
  createdAt: z.date(),
  statusChangedAt: z.date(),
  finishedAt: z.date().nullable(),
  estimatedDeliveryAt: z.date().nullable(),
  client: z.strictObject({
    id: z.number().int(),
    name: z.string(),
    phone: z.string().nullable(),
    email: z.string(),
  }),
  courier: courierSchema.nullable(),
  recipient: z.strictObject({ name: z.string(), phone: z.string() }),
  route: z.strictObject({ from: addressSchema, to: addressSchema }),
  parcel: z.strictObject({
    weight: z.number(),
    length: z.number(),
    width: z.number(),
    height: z.number(),
    fragile: z.boolean(),
  }),
  pricing: z.strictObject({
    price: z.number(),
    coefficient: z.number(),
    distanceKm: z.number(),
    estimatedMinutes: z.number().int().nullable(),
    tariffName: z.string(),
  }),
  payment: managerOrderPaymentSchema,
  history: z.array(historyEntrySchema),
  offers: z.array(offerSchema),
  tickets: z.array(ticketSchema),
  actions: managerOrderActionsSchema,
});

export type ManagerOrderDetails = z.infer<typeof managerOrderDetailsSchema>;
export type ManagerOrderPayment = z.infer<typeof managerOrderPaymentSchema>;
export type ManagerOrderActions = z.infer<typeof managerOrderActionsSchema>;
export type ManagerOrderHistoryEntry = z.infer<typeof historyEntrySchema>;
export type ManagerOrderOffer = z.infer<typeof offerSchema>;
export type ManagerOrderTicket = z.infer<typeof ticketSchema>;
