import type { OrderDraftData } from '@/features/order-draft';
import { toPackageFormValues } from '@/features/package-form';
import type { OrderDetails } from '@/shared/api';
import { ROUTE_POINT } from '@/shared/config';
import { ADDRESS_NAME_SEPARATOR, NO_APARTMENT } from '../config/repeat-order';

type OrderPoint = OrderDetails['pickup'];

function toRouteAddress(point: OrderPoint): OrderDraftData['route'][typeof ROUTE_POINT.PICKUP] {
  return {
    point: { latitude: point.latitude, longitude: point.longitude },
    text: [point.street, point.house].join(ADDRESS_NAME_SEPARATOR),
    parts: { city: point.city, street: point.street, house: point.house },
  };
}

// The draft of a new order with the same route, recipient and package; the price is not carried
// over, the order form estimates it again.
export function buildRepeatDraft(order: OrderDetails): OrderDraftData {
  return {
    route: {
      [ROUTE_POINT.PICKUP]: toRouteAddress(order.pickup),
      [ROUTE_POINT.DELIVERY]: toRouteAddress(order.delivery),
    },
    package: toPackageFormValues(order.parcel),
    apartments: {
      [ROUTE_POINT.PICKUP]: order.pickup.apartment ?? NO_APARTMENT,
      [ROUTE_POINT.DELIVERY]: order.delivery.apartment ?? NO_APARTMENT,
    },
    recipient: { name: order.recipient.name, phone: order.recipient.phone },
  };
}
