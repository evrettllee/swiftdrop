import { z } from 'zod';
import { geoPointSchema } from '../../../common/schemas/geo-point.schema';

// The body of location:update. Strict, as every socket body: any other field makes it invalid. The
// shared point schema of HTTP bodies stays as it is.
export const locationUpdateBodySchema = z.strictObject(geoPointSchema.shape);

export type LocationUpdateBody = z.infer<typeof locationUpdateBodySchema>;
