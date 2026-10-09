import { z } from 'zod';

// Response of POST /api/pricing/estimates
export const priceEstimateSchema = z.object({
  price: z.number(),
  currency: z.string(),
  distanceKm: z.number(),
  estimatedMinutes: z.number(),
  // Demand coefficient from the backend, always 1 for now; the UI will show the surcharge later.
  coefficient: z.number(),
});

export type PriceEstimate = z.infer<typeof priceEstimateSchema>;

// The package of the estimate request and of a new order; the parsed package form has this shape.
export type PackageParams = {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  isFragile: boolean;
};
