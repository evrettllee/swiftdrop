import { z } from 'zod';
import { STAFF_COURIER_EVENT_KIND_VALUES } from '../constants/socket-events.constants';
import type { StaffCourierEvent, StaffCourierLocationEvent } from '../types/realtime.types';

export const staffCourierLocationEventSchema = z.strictObject({
  courierId: z.number().int().positive(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  at: z.iso.datetime(),
}) satisfies z.ZodType<StaffCourierLocationEvent>;

export const staffCourierEventSchema = z.strictObject({
  courierId: z.number().int().positive(),
  kind: z.enum(STAFF_COURIER_EVENT_KIND_VALUES),
}) satisfies z.ZodType<StaffCourierEvent>;
