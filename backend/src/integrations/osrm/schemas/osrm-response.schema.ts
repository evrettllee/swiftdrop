import { z } from 'zod';

// The part of the OSRM answer that is used: the distance is in meters, the duration in seconds, the
// geometry (a polyline with 6 digits) comes only when the query asks for it. The legs are the parts
// of the route between the requested points, each with its own duration. The waypoints are the
// requested points snapped to the roads, as [longitude, latitude].
export const osrmResponseSchema = z.object({
  code: z.string(),
  routes: z
    .array(
      z.object({
        distance: z.number(),
        duration: z.number(),
        geometry: z.string().optional(),
        legs: z.array(z.object({ duration: z.number() })).optional(),
      }),
    )
    .optional(),
  waypoints: z.array(z.object({ location: z.tuple([z.number(), z.number()]) })).optional(),
});
