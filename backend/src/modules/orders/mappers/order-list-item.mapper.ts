import { CURRENCY } from '@/common/constants/money.constants';
import type { OrderStatus } from '@/common/enums/order-status.enum';
import { shortPersonName } from '@/common/utils/person-name';
import { COURIER_VISIBLE_STATUSES } from '@/modules/deliveries/constants/deliveries.constants';
import type { OrderListItem, OrderListRow } from '../types/orders.types';

const courierVisible = new Set<OrderStatus>(COURIER_VISIBLE_STATUSES);

export function toOrderListItem(row: OrderListRow): OrderListItem {
  const { courierFirstName, courierLastName, ...order } = row;
  const showCourier =
    courierVisible.has(row.status) && courierFirstName !== null && courierLastName !== null;

  return {
    ...order,
    price: Number(row.price),
    currency: CURRENCY,
    courier: showCourier ? { name: shortPersonName(courierFirstName, courierLastName) } : null,
  };
}
