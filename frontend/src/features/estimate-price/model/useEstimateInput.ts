import { useMemo } from 'react';
import type { PackageParams } from '@/shared/api';
import type { GeoPoint } from '@/shared/lib/geo';
import type { EstimateInput } from './estimate-input';

// The body of the estimate request, or null while a point or the package is missing. The object
// stays the same while the values stay the same, so an effect that depends on it restarts only
// when something really changed.
export function useEstimateInput(
  pickup: GeoPoint | null,
  delivery: GeoPoint | null,
  params: PackageParams | null,
): EstimateInput | null {
  const weightKg = params?.weightKg;
  const lengthCm = params?.lengthCm;
  const widthCm = params?.widthCm;
  const heightCm = params?.heightCm;
  const isFragile = params?.isFragile;

  return useMemo<EstimateInput | null>(() => {
    if (
      pickup === null ||
      delivery === null ||
      weightKg === undefined ||
      lengthCm === undefined ||
      widthCm === undefined ||
      heightCm === undefined ||
      isFragile === undefined
    ) {
      return null;
    }

    return { pickup, delivery, package: { weightKg, lengthCm, widthCm, heightCm, isFragile } };
  }, [pickup, delivery, weightKg, lengthCm, widthCm, heightCm, isFragile]);
}
