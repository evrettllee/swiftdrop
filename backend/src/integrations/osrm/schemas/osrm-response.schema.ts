import { z } from 'zod';

// The part of the OSRM answer that is used: the distance is in meters, the duration in seconds, the
// geometry (a polyline with 6 digits) comes only when the query asks for it.
export const osrmResponseSchema = z.object({
  code: z.string(),
  routes: z
    .array(
      z.object({ distance: z.number(), duration: z.number(), geometry: z.string().optional() }),
    )
    .optional(),
});
