import type { CourierOrder, CourierOrderRow } from '../types/deliveries.types';

export function toCourierOrder({ sender, ...row }: CourierOrderRow): CourierOrder {
  return {
    ...row,
    sender: { name: `${sender.firstName} ${sender.lastName}`, phone: sender.phone },
  };
}
