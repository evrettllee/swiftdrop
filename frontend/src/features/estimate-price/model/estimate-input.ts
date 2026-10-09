import type { PackageParams } from '@/shared/api';
import type { GeoPoint } from '@/shared/lib/geo';

export type EstimateInput = {
  pickup: GeoPoint;
  delivery: GeoPoint;
  package: PackageParams;
};
