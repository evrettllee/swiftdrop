import type { addresses, packages } from '../../db/schema';
import type { CreateOrderDto } from '../dto/create-order.dto';

type AddressRow = typeof addresses.$inferInsert;
type PackageRow = typeof packages.$inferInsert;

// An order keeps its own copy of the address, so a later edit of a saved address cannot change it.
export function toAddressRow(address: CreateOrderDto['pickup']): AddressRow {
  return {
    city: address.city,
    street: address.street,
    house: address.house,
    apartment: address.apartment ?? null,
    latitude: address.latitude,
    longitude: address.longitude,
  };
}

export function toPackageRow(orderId: number, spec: CreateOrderDto['package']): PackageRow {
  return {
    orderId,
    weight: spec.weightKg,
    length: spec.lengthCm,
    width: spec.widthCm,
    height: spec.heightCm,
    isFragile: spec.isFragile,
  };
}
