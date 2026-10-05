import { z } from 'zod';

// Response of POST /api/pricing/estimates
export const priceEstimateSchema = z.object({
  price: z.number(),
  currency: z.string(),
  distanceKm: z.number(),
  estimatedMinutes: z.number(),
  // The demand coefficient: 1 means the base price, a higher value is shown to the user as a surcharge.
  coefficient: z.number(),
});
