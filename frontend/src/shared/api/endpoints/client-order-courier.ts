import { z } from 'zod';
import { DELIVERY_CODE_LENGTH } from '@/shared/config';
import { courierVehicleSchema } from './courier';

// Response of GET /api/orders/:orderId/courier (the ClientOrderCourier of the backend): who carries
// the order, from the assignment on, and the code for them, only while the parcel is on its way.
// The phone of the courier comes too, but the client's pages do not show it, so the schema does not
// keep it.
export const clientOrderCourierSchema = z.object({
  courier: z
    .object({
      // "Дмитрий С.": the first name and the first letter of the last name.
      name: z.string(),
      vehicle: courierVehicleSchema.nullable(),
    })
    .nullable(),
  deliveryCode: z.string().length(DELIVERY_CODE_LENGTH).nullable(),
});

export type ClientOrderCourier = z.infer<typeof clientOrderCourierSchema>;
