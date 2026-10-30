import { z } from 'zod';
import { ORDER_STATUS_VALUES } from '@/common/enums/order-status.enum';
import { STAFF_ORDER_EVENT_KIND_VALUES } from '../constants/socket-events.constants';
import type { StaffOrderEvent } from '../types/realtime.types';

export const staffOrderEventSchema = z.strictObject({
  orderId: z.number().int().positive(),
  kind: z.enum(STAFF_ORDER_EVENT_KIND_VALUES),
  status: z.enum(ORDER_STATUS_VALUES),
  statusChangedAt: z.iso.datetime(),
  courierId: z.number().int().positive().nullable(),
}) satisfies z.ZodType<StaffOrderEvent>;
