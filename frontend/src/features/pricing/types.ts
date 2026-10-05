import type { z } from 'zod';
import type { priceEstimateSchema } from './schemas';

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type PackageParams = {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  isFragile: boolean;
};

export type EstimateInput = {
  pickup: GeoPoint;
  delivery: GeoPoint;
  package: PackageParams;
};

export type PriceEstimate = z.infer<typeof priceEstimateSchema>;
