import { DELIVERY_AREA_COORDINATE_DIGITS } from '../constants/assignment.constants';
import type { CourierOffer, CourierOfferRow } from '../types/assignment.types';

function roundToArea(coordinate: number): number {
  return Number(coordinate.toFixed(DELIVERY_AREA_COORDINATE_DIGITS));
}

export function toCourierOffer(row: CourierOfferRow): CourierOffer {
  return {
    ...row,
    expiresAt: row.expiresAt.toISOString(),
    delivery: {
      ...row.delivery,
      latitude: roundToArea(row.delivery.latitude),
      longitude: roundToArea(row.delivery.longitude),
    },
  };
}
