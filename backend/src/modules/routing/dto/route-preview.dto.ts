import { z } from 'zod';
import { geoPointSchema } from '../../../common/schemas/geo-point.schema';

export const routePreviewSchema = z.object({
  pickup: geoPointSchema,
  delivery: geoPointSchema,
});

export type RoutePreviewDto = z.infer<typeof routePreviewSchema>;
