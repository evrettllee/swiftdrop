import { fullPersonName } from '@/common/utils/person-name';
import type { CourierOrder, CourierOrderRow } from '../types/deliveries.types';

export function toCourierOrder({ sender, ...row }: CourierOrderRow): CourierOrder {
  return {
    ...row,
    sender: { name: fullPersonName(sender.firstName, sender.lastName), phone: sender.phone },
  };
}
