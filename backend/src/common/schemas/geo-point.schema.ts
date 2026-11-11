import { z } from 'zod';
import {
  GEO_VALIDATION_MESSAGES,
  LATITUDE_MAX,
  LATITUDE_MIN,
  LONGITUDE_MAX,
  LONGITUDE_MIN,
} from '@/common/constants/geo.constants';

export const geoPointSchema = z.object({
  latitude: z
    .number(GEO_VALIDATION_MESSAGES.LATITUDE_INVALID)
    .min(LATITUDE_MIN, GEO_VALIDATION_MESSAGES.LATITUDE_INVALID)
    .max(LATITUDE_MAX, GEO_VALIDATION_MESSAGES.LATITUDE_INVALID),
  longitude: z
    .number(GEO_VALIDATION_MESSAGES.LONGITUDE_INVALID)
    .min(LONGITUDE_MIN, GEO_VALIDATION_MESSAGES.LONGITUDE_INVALID)
    .max(LONGITUDE_MAX, GEO_VALIDATION_MESSAGES.LONGITUDE_INVALID),
});

export type GeoPoint = z.infer<typeof geoPointSchema>;
