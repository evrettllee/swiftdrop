import type { AddressParts, PackageParams } from '@/shared/api';
import type { GeoPoint } from '@/shared/lib/geo';
import type { CreateOrderInput, OrderAddressInput } from '../api/create-order';
import { CHECKOUT_TEXTS } from '../config/texts';
import type { CheckoutFormValues } from '../model/checkout-form';

type RoutePoint = {
  point: GeoPoint | null;
  parts: AddressParts | null;
};

type FullAddressParts = { city: string; street: string; house: string };

// An order needs the city, the street and the house of each point.
function isFullAddress(parts: AddressParts | null): parts is FullAddressParts {
  return parts !== null && parts.city !== null && parts.street !== null && parts.house !== null;
}

// What is wrong with a route point, or null when an order can be placed with it.
export function getAddressError({ point, parts }: RoutePoint): string | null {
  let error: string | null = null;

  if (point === null) {
    error = CHECKOUT_TEXTS.ADDRESS_REQUIRED;
  } else if (!isFullAddress(parts)) {
    error = CHECKOUT_TEXTS.HOUSE_REQUIRED;
  }

  return error;
}

function toAddress({ point, parts }: RoutePoint, apartment: string): OrderAddressInput | null {
  if (point === null || !isFullAddress(parts)) {
    return null;
  }

  return {
    latitude: point.latitude,
    longitude: point.longitude,
    city: parts.city,
    street: parts.street,
    house: parts.house,
    ...(apartment === '' ? {} : { apartment }),
  };
}

// The body of POST /api/orders, or null while the route or the package is not ready.
export function buildOrderInput(
  pickup: RoutePoint,
  delivery: RoutePoint,
  params: PackageParams | null,
  values: CheckoutFormValues,
): CreateOrderInput | null {
  const pickupAddress = toAddress(pickup, values.pickupApartment);
  const deliveryAddress = toAddress(delivery, values.deliveryApartment);

  return pickupAddress === null || deliveryAddress === null || params === null
    ? null
    : {
        pickup: pickupAddress,
        delivery: deliveryAddress,
        recipient: { name: values.recipientName, phone: values.recipientPhone },
        package: params,
      };
}
