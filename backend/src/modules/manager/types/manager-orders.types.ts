import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { ListPage } from '@/common/types/page.types';
import type { DateRange } from '@/common/utils/date-range';
import type { ManagerStatusGroup, PaymentState } from '../constants/manager-orders.constants';

export type OrderSearch =
  | { kind: 'number'; orderId: number | null; phone: string | null }
  | { kind: 'text'; pattern: string };

export type ManagerOrderFilters = {
  period: DateRange;
  courierId: number | null;
  payment: PaymentState[] | null;
  fragile: boolean;
  hasOpenTicket: boolean;
  search: OrderSearch | null;
};

export type ManagerOrderStreet = { street: string; house: string };

export type ManagerOrderListItem = {
  id: number;
  createdAt: Date;
  status: OrderStatus;
  statusChangedAt: Date;
  price: number;
  client: { name: string; phone: string | null };
  route: { from: ManagerOrderStreet; to: ManagerOrderStreet };
  courier: { id: number; name: string } | null;
  fragile: boolean;
  paymentState: PaymentState;
};

export type ManagerOrdersPage = ListPage<ManagerOrderListItem>;

export type ManagerOrderCounts = Record<
  'attention' | 'active' | 'awaitingPayment' | 'finished' | 'cancelled' | 'all',
  number
>;

export type ManagerStatusGroups = ManagerStatusGroup[] | null;
