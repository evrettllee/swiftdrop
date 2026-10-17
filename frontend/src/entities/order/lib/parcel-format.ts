import type { OrderDetails } from '@/shared/api';
import { APP_LOCALE } from '@/shared/config';
import { WEIGHT_FRACTION_DIGITS } from '../config/parcel';
import { ORDER_TEXTS } from '../config/texts';

// The parcel of an order: the page of an order and an offer to a courier share its shape.
type OrderParcel = Pick<OrderDetails['parcel'], 'weightKg' | 'lengthCm' | 'widthCm' | 'heightCm'>;

const weightFormat = new Intl.NumberFormat(APP_LOCALE, {
  maximumFractionDigits: WEIGHT_FRACTION_DIGITS,
});

// For example "2,5 кг"
export function formatParcelWeight(parcel: Pick<OrderParcel, 'weightKg'>): string {
  return ORDER_TEXTS.weight(weightFormat.format(parcel.weightKg));
}

// For example "40 × 30 × 20 см"
export function formatParcelSize(parcel: OrderParcel): string {
  return ORDER_TEXTS.size(parcel.lengthCm, parcel.widthCm, parcel.heightCm);
}
