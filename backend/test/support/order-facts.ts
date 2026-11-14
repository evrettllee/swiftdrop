import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';

type Step = readonly [OrderStatus, string, string];

export function orderFactsOf(steps: readonly Step[], autoActor: string) {
  const paid = steps.find(([status]) => status === ORDER_STATUS.CONFIRMED);
  const first = steps.find(([status]) => status === ORDER_STATUS.COURIER_ASSIGNED);

  return {
    paidAt: paid ? new Date(paid[1]) : null,
    firstAssignedAt: first ? new Date(first[1]) : null,
    firstAssignedAuto: first ? first[2] === autoActor : null,
  };
}
