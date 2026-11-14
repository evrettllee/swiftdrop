import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import type { OrderPlan } from './admin-analytics';

const { CONFIRMED, COURIER_ASSIGNED, DELIVERED } = ORDER_STATUS;
const { DECLINED, EXPIRED } = ORDER_OFFER_STATUS;

const delivered = (
  day: string,
  fields: Omit<OrderPlan, 'createdAt' | 'status' | 'steps'> & {
    assignedAt: string;
    by: 'courier' | 'manager';
  },
): OrderPlan => {
  const { assignedAt, by, ...rest } = fields;

  return {
    createdAt: `${day}T06:55:00Z`,
    status: DELIVERED,
    ...rest,
    steps: [
      [CONFIRMED, `${day}T07:00:00Z`, 'system'],
      [COURIER_ASSIGNED, `${day}T${assignedAt}Z`, by],
    ],
  };
};

export function deliveryPlans(testZoneId: number, eastZoneId: number): OrderPlan[] {
  return [
    delivered('2026-10-01', {
      price: '12.00',
      zoneId: testZoneId,
      finishedAt: '2026-10-01T07:50:00Z',
      promisedAt: '2026-10-01T08:00:00Z',
      assignedAt: '07:05:00',
      by: 'courier',
    }),
    delivered('2026-10-02', {
      price: '8.00',
      zoneId: testZoneId,
      finishedAt: '2026-10-02T08:20:00Z',
      promisedAt: '2026-10-02T08:00:00Z',
      assignedAt: '07:10:00',
      by: 'manager',
      offers: [
        [DECLINED, '2026-10-02T07:01:00Z'],
        [DECLINED, '2026-10-02T07:03:00Z'],
        [EXPIRED, '2026-10-02T07:05:00Z'],
      ],
    }),
    delivered('2026-10-03', {
      finishedAt: '2026-10-03T07:30:00Z',
      promisedAt: null,
      zoneId: null,
      assignedAt: '07:20:00',
      by: 'courier',
    }),
    delivered('2026-10-04', {
      finishedAt: '2026-10-04T08:00:00Z',
      promisedAt: '2026-10-04T08:00:00Z',
      zoneId: eastZoneId,
      assignedAt: '07:00:00',
      by: 'courier',
    }),
    delivered('2026-09-25', {
      zoneId: testZoneId,
      finishedAt: '2026-09-25T09:00:00Z',
      promisedAt: '2026-09-25T08:00:00Z',
      assignedAt: '07:01:00',
      by: 'courier',
    }),
  ];
}
