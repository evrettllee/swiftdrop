import { z } from 'zod';
import { geoPointSchema } from '../../common/schemas/geo-point.schema';
import { packageSpecSchema } from '../../common/schemas/package-spec.schema';

export const estimatePriceSchema = z.object({
  pickup: geoPointSchema,
  delivery: geoPointSchema,
  package: packageSpecSchema,
});

export type EstimatePriceDto = z.infer<typeof estimatePriceSchema>;
