import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import type { OrderPlan } from './admin-analytics';

const { PENDING, CONFIRMED, COURIER_ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED } = ORDER_STATUS;
export const ANALYTICS_PERIOD = { from: '2026-10-01', to: '2026-10-07' };

export const BUSINESS_PLANS: OrderPlan[] = [
  {
    createdAt: '2026-10-01T07:00:00Z',
    status: DELIVERED,
    price: '10.00',
    finishedAt: '2026-10-01T07:40:00Z',
    steps: [
      [CONFIRMED, '2026-10-01T07:02:00Z', 'system'],
      [COURIER_ASSIGNED, '2026-10-01T07:05:00Z', 'courier'],
      [DELIVERED, '2026-10-01T07:40:00Z', 'courier'],
    ],
  },
  {
    createdAt: '2026-10-03T09:00:00Z',
    status: DELIVERED,
    price: '20.50',
    finishedAt: '2026-10-03T10:00:00Z',
    steps: [
      [CONFIRMED, '2026-10-03T09:01:00Z', 'system'],
      [COURIER_ASSIGNED, '2026-10-03T09:10:00Z', 'manager'],
    ],
  },
  {
    createdAt: '2026-10-02T08:00:00Z',
    status: CANCELLED,
    steps: [[CANCELLED, '2026-10-02T08:20:00Z', 'system']],
  },
  {
    createdAt: '2026-10-02T09:00:00Z',
    status: CANCELLED,
    steps: [[CANCELLED, '2026-10-02T09:05:00Z', 'client']],
  },
  {
    createdAt: '2026-10-04T08:00:00Z',
    status: CANCELLED,
    price: '15.00',
    refundedAt: '2026-10-04T09:00:00Z',
    steps: [
      [CONFIRMED, '2026-10-04T08:01:00Z', 'system'],
      [CANCELLED, '2026-10-04T08:30:00Z', 'client'],
    ],
  },
  {
    createdAt: '2026-10-05T08:00:00Z',
    status: CANCELLED,
    steps: [
      [CONFIRMED, '2026-10-05T08:01:00Z', 'system'],
      [CANCELLED, '2026-10-05T09:00:00Z', 'system'],
    ],
  },
  {
    createdAt: '2026-10-06T08:00:00Z',
    status: CANCELLED,
    steps: [
      [CONFIRMED, '2026-10-06T08:01:00Z', 'system'],
      [CANCELLED, '2026-10-06T08:30:00Z', 'manager'],
    ],
  },
  {
    createdAt: '2026-10-07T08:00:00Z',
    status: IN_TRANSIT,
    steps: [
      [CONFIRMED, '2026-10-07T08:01:00Z', 'system'],
      [COURIER_ASSIGNED, '2026-10-07T08:03:00Z', 'courier'],
    ],
  },
  { createdAt: '2026-10-07T10:00:00Z', status: PENDING },
  {
    createdAt: '2026-09-30T21:30:00Z',
    status: DELIVERED,
    price: '5.00',
    finishedAt: '2026-10-01T06:00:00Z',
    steps: [
      [CONFIRMED, '2026-09-30T21:31:00Z', 'system'],
      [COURIER_ASSIGNED, '2026-09-30T21:40:00Z', 'courier'],
    ],
  },
  {
    createdAt: '2026-09-25T08:00:00Z',
    status: DELIVERED,
    price: '30.00',
    finishedAt: '2026-09-25T09:00:00Z',
    steps: [
      [CONFIRMED, '2026-09-25T08:01:00Z', 'system'],
      [COURIER_ASSIGNED, '2026-09-25T08:05:00Z', 'courier'],
    ],
  },
  {
    createdAt: '2026-09-26T08:00:00Z',
    status: CANCELLED,
    steps: [[CANCELLED, '2026-09-26T08:20:00Z', 'system']],
  },
  {
    createdAt: '2026-10-07T21:30:00Z',
    status: DELIVERED,
    price: '99.00',
    finishedAt: '2026-10-07T22:00:00Z',
  },
];
