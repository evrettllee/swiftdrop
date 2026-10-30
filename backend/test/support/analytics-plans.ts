import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';

export type AnalyticsActor = 'client' | 'courier' | 'manager' | 'system';

export type AnalyticsPlan = {
  status: OrderStatus;
  createdAt: string;
  price: string;
  courier: 'first' | 'second' | null;
  finishedAt: string | null;
  paidAt: string | null;
  refunded: boolean;
  steps: [OrderStatus, string, AnalyticsActor][];
};

const plan = (
  fields: Partial<AnalyticsPlan> & Pick<AnalyticsPlan, 'status' | 'createdAt' | 'price'>,
) => ({
  courier: null,
  finishedAt: null,
  paidAt: null,
  refunded: false,
  steps: [],
  ...fields,
});

const { CONFIRMED, COURIER_ASSIGNED: ASSIGNED, CANCELLED, DELIVERED } = ORDER_STATUS;

export const ANALYTICS_PLANS: AnalyticsPlan[] = [
  plan({
    status: DELIVERED,
    createdAt: '2026-10-01T06:10:00Z',
    price: '10.00',
    courier: 'first',
    finishedAt: '2026-10-01T06:40:00Z',
    paidAt: '2026-10-01T06:12:00Z',
    steps: [
      [CONFIRMED, '2026-10-01T06:12:00Z', 'system'],
      [ASSIGNED, '2026-10-01T06:15:00Z', 'courier'],
    ],
  }),
  plan({
    status: DELIVERED,
    createdAt: '2026-10-01T06:40:00Z',
    price: '20.50',
    courier: 'first',
    finishedAt: '2026-10-01T07:31:00Z',
    paidAt: '2026-10-01T06:41:00Z',
    steps: [
      [CONFIRMED, '2026-10-01T06:41:00Z', 'system'],
      [ASSIGNED, '2026-10-01T06:51:00Z', 'manager'],
      [ASSIGNED, '2026-10-01T06:55:00Z', 'manager'],
    ],
  }),
  plan({
    status: CANCELLED,
    createdAt: '2026-10-03T15:05:00Z',
    price: '7.00',
    finishedAt: '2026-10-03T15:20:00Z',
    paidAt: '2026-10-03T15:06:00Z',
    refunded: true,
    steps: [
      [CONFIRMED, '2026-10-03T15:06:00Z', 'system'],
      [CANCELLED, '2026-10-03T15:20:00Z', 'client'],
    ],
  }),
  plan({
    status: CANCELLED,
    createdAt: '2026-10-03T15:30:00Z',
    price: '6.00',
    finishedAt: '2026-10-03T15:50:00Z',
    steps: [[CANCELLED, '2026-10-03T15:50:00Z', 'system']],
  }),
  plan({
    status: ORDER_STATUS.PICKED_UP,
    createdAt: '2026-10-05T09:00:00Z',
    price: '5.25',
    courier: 'second',
    paidAt: '2026-10-05T09:01:00Z',
    steps: [
      [CONFIRMED, '2026-10-05T09:01:00Z', 'system'],
      [ASSIGNED, '2026-10-05T09:05:00Z', 'courier'],
    ],
  }),
  plan({ status: ORDER_STATUS.PENDING, createdAt: '2026-10-05T10:00:00Z', price: '99.00' }),
  plan({
    status: CANCELLED,
    createdAt: '2026-10-06T08:00:00Z',
    price: '50.00',
    finishedAt: '2026-10-06T08:30:00Z',
    steps: [[CANCELLED, '2026-10-06T08:30:00Z', 'system']],
  }),
  plan({
    status: DELIVERED,
    createdAt: '2026-09-28T07:00:00Z',
    price: '8.00',
    courier: 'second',
    finishedAt: '2026-09-28T07:20:00Z',
    paidAt: '2026-09-28T07:00:00Z',
    steps: [
      [CONFIRMED, '2026-09-28T07:00:00Z', 'system'],
      [ASSIGNED, '2026-09-28T07:02:00Z', 'courier'],
    ],
  }),
];

export const ANALYTICS_ESTIMATED_MINUTES = 30;
