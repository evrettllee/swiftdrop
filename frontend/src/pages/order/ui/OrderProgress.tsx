import { memo } from 'react';
import { buildOrderProgress, OrderProgressSteps } from '@/entities/order';
import type { OrderDetails } from '@/shared/api';
import { PROGRESS_ALIASES, PROGRESS_STEPS, PROGRESS_STOP_LABELS } from '../config/progress';
import { ORDER_DETAILS_TEXTS } from '../config/texts';

type OrderProgressProps = {
  order: OrderDetails;
};

// "Ход заказа" with the steps of the client.
export const OrderProgress = memo(function OrderProgress({ order }: OrderProgressProps) {
  const steps = buildOrderProgress(order, {
    steps: PROGRESS_STEPS,
    stopLabels: PROGRESS_STOP_LABELS,
    aliases: PROGRESS_ALIASES,
  });

  return <OrderProgressSteps title={ORDER_DETAILS_TEXTS.SECTION_PROGRESS} steps={steps} />;
});
