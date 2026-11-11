import { OrderProgressSteps } from '@/entities/order';
import type { ManagerOrderDetails } from '@/shared/staff-api';
import { MANAGER_ORDER_TEXTS } from '../config/texts';
import { buildManagerProgress } from '../lib/progress';

type ProgressSectionProps = {
  order: ManagerOrderDetails;
};

export function ProgressSection({ order }: ProgressSectionProps) {
  return (
    <OrderProgressSteps
      title={MANAGER_ORDER_TEXTS.SECTION_PROGRESS}
      steps={buildManagerProgress(order)}
    />
  );
}
