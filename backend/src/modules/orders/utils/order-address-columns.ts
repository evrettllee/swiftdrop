import { alias } from 'drizzle-orm/pg-core';
import { addresses } from '../../../database/schema';
import { ORDER_ADDRESS_ALIAS } from '../constants/orders.constants';

// An order joins the addresses table twice, so the pickup and the delivery get their own aliases.
export function aliasOrderAddresses() {
  return {
    pickup: alias(addresses, ORDER_ADDRESS_ALIAS.PICKUP),
    delivery: alias(addresses, ORDER_ADDRESS_ALIAS.DELIVERY),
  };
}

type OrderAddresses = ReturnType<typeof aliasOrderAddresses>;
type OrderAddressTable = OrderAddresses[keyof OrderAddresses];

// The columns of an address as the list of orders shows it.
export function addressViewColumns<T extends OrderAddressTable>(address: T) {
  return {
    city: address.city,
    street: address.street,
    house: address.house,
    apartment: address.apartment,
  };
}

// The same address with its point on the map, for the page of an order.
export function addressPointColumns<T extends OrderAddressTable>(address: T) {
  return {
    ...addressViewColumns(address),
    latitude: address.latitude,
    longitude: address.longitude,
  };
}
