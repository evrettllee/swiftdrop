import { z } from 'zod';
import { dateSchema, orderStatusSchema } from '@/shared/api';
import { SOCKET_EVENTS } from './socket-events';

export const STAFF_ORDER_EVENT_KIND = {
  CREATED: 'created',
  STATUS: 'status',
  COURIER: 'courier',
} as const;

export const STAFF_COURIER_EVENT_KIND = {
  ONLINE: 'online',
  OFFLINE: 'offline',
} as const;

export const STAFF_EVENT_SCHEMAS = {
  [SOCKET_EVENTS.STAFF_ORDER]: z.object({
    orderId: z.number(),
    kind: z.enum(STAFF_ORDER_EVENT_KIND),
    status: orderStatusSchema,
    statusChangedAt: dateSchema,
    courierId: z.number().nullable(),
  }),
  [SOCKET_EVENTS.STAFF_COURIER]: z.object({
    courierId: z.number(),
    kind: z.enum(STAFF_COURIER_EVENT_KIND),
  }),
  [SOCKET_EVENTS.STAFF_COURIER_LOCATION]: z.object({
    courierId: z.number(),
    lat: z.number(),
    lng: z.number(),
    at: dateSchema,
  }),
  [SOCKET_EVENTS.STAFF_ZONE]: z.object({
    zoneId: z.number(),
  }),
};
