import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { PaymentState } from '../constants/manager-orders.constants';
import type { ManagerOrderListItem, ManagerOrderStreet } from '../types/manager-orders.types';

type PersonName = { firstName: string; lastName: string };

export type ManagerOrderRow = {
  orderId: number;
  createdAt: Date;
  status: OrderStatus;
  statusChangedAt: Date;
  price: string;
  client: PersonName & { phone: string | null };
  pickup: ManagerOrderStreet;
  delivery: ManagerOrderStreet;
  courierId: number | null;
  courier: PersonName | null;
  fragile: boolean;
  paymentState: PaymentState;
};

function fullName({ firstName, lastName }: PersonName): string {
  return `${firstName} ${lastName}`;
}

export function toManagerOrderListItem(row: ManagerOrderRow): ManagerOrderListItem {
  return {
    id: row.orderId,
    createdAt: row.createdAt,
    status: row.status,
    statusChangedAt: row.statusChangedAt,
    price: Number(row.price),
    client: { name: fullName(row.client), phone: row.client.phone },
    route: { from: row.pickup, to: row.delivery },
    courier:
      row.courierId === null || row.courier === null
        ? null
        : { id: row.courierId, name: fullName(row.courier) },
    fragile: row.fragile,
    paymentState: row.paymentState,
  };
}
