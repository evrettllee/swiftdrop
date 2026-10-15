import type { OrderDetails } from '@/shared/api';
import { APP_LOCALE } from '@/shared/config';
import {
  BY_PHONE_FORMAT,
  BY_PHONE_PATTERN,
  WEIGHT_FRACTION_DIGITS,
} from '../config/order-details-format';
import { ORDER_DETAILS_TEXTS } from '../config/texts';

type OrderParcel = OrderDetails['parcel'];

const weightFormat = new Intl.NumberFormat(APP_LOCALE, {
  maximumFractionDigits: WEIGHT_FRACTION_DIGITS,
});

// For example "+375 29 123-45-67"
export function formatPhone(phone: string): string {
  return phone.replace(BY_PHONE_PATTERN, BY_PHONE_FORMAT);
}

// For example "2,5 кг"
export function formatWeight(parcel: OrderParcel): string {
  return ORDER_DETAILS_TEXTS.weight(weightFormat.format(parcel.weightKg));
}

// For example "40 × 30 × 20 см"
export function formatSize(parcel: OrderParcel): string {
  return ORDER_DETAILS_TEXTS.size(parcel.lengthCm, parcel.widthCm, parcel.heightCm);
}
