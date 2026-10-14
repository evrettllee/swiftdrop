import { z } from 'zod';
import { COURIERS_VALIDATION_MESSAGES } from '../constants/couriers.constants';

export const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(COURIERS_VALIDATION_MESSAGES.AVAILABILITY_INVALID),
});

export type UpdateAvailabilityDto = z.infer<typeof updateAvailabilitySchema>;
