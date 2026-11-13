import { fullPersonName } from '@/common/utils/person-name';
import type { CourierLookupItem, CourierLookupRow } from '../types/manager-courier-lookup.types';

export function toCourierLookupItem(row: CourierLookupRow): CourierLookupItem {
  return {
    courierId: row.courierId,
    name: fullPersonName(row.firstName, row.lastName),
    vehicleType: row.vehicleType,
  };
}
