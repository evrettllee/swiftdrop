import type { OrderDetails, OrderListItem } from '@/shared/api';
import { APP_LOCALE } from '@/shared/config';
import {
  BY_PHONE_FORMAT,
  BY_PHONE_PATTERN,
  WEIGHT_FRACTION_DIGITS,
} from '../config/order-details-format';
import { ORDER_DETAILS_TEXTS } from '../config/texts';

type OrderAddress = OrderListItem['pickup'];
type OrderParcel = OrderDetails['parcel'];

const weightFormat = new Intl.NumberFormat(APP_LOCALE, {
  maximumFractionDigits: WEIGHT_FRACTION_DIGITS,
});

// For example "пр-т Притыцкого, 83, кв. 47, Минск": the address on the page of an order.
export function formatFullAddress(address: OrderAddress): string {
  const parts = [address.street, address.house];

  if (address.apartment !== null) {
    parts.push(ORDER_DETAILS_TEXTS.apartment(address.apartment));
  }

  parts.push(address.city);

  return parts.join(', ');
}

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
