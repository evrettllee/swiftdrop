import { z } from 'zod';
import type { StaffZoneEvent } from '../types/realtime.types';

export const staffZoneEventSchema = z.strictObject({
  zoneId: z.number().int().positive(),
}) satisfies z.ZodType<StaffZoneEvent>;
