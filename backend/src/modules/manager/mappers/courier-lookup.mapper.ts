import type { CourierLookupItem, CourierLookupRow } from '../types/manager-courier-lookup.types';

export function toCourierLookupItem(row: CourierLookupRow): CourierLookupItem {
  return {
    courierId: row.courierId,
    name: `${row.firstName} ${row.lastName}`,
    vehicleType: row.vehicleType,
  };
}
