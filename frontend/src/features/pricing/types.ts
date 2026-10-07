import type { GeoPoint } from '../../shared/types';
import type { PackageParams } from './schemas';

export type EstimateInput = {
  pickup: GeoPoint;
  delivery: GeoPoint;
  package: PackageParams;
};
