import { z } from 'zod';
import { DELIVERY_CODE_LENGTH } from '@/shared/config';
import { courierVehicleSchema } from './courier';

// Response of GET /api/orders/:orderId/courier (the ClientOrderCourier of the backend): who carries
// the order, from the assignment on, and the code for them, only while the parcel is on its way.
export const clientOrderCourierSchema = z.object({
  courier: z
    .object({
      // "Дмитрий С.": the first name and the first letter of the last name.
      name: z.string(),
      vehicle: courierVehicleSchema.nullable(),
      // Only while the order is with the courier (assigned, picked up, in transit) and the courier
      // has a phone: otherwise the key is absent, not null, and the client cannot call.
      phone: z.string().optional(),
    })
    .nullable(),
  deliveryCode: z.string().length(DELIVERY_CODE_LENGTH).nullable(),
});

export type ClientOrderCourier = z.infer<typeof clientOrderCourierSchema>;
