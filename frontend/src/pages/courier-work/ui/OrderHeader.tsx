import { formatOrderNumber } from '@/entities/order';
import { joinClassNames } from '@/shared/lib/class-names';
import { PageTitle } from '@/shared/ui/page-title';
import { ORDER_STEPS_TOTAL, type OrderStep } from '../config/order-steps';
import { ORDER_STEP_TEXTS, ORDER_TEXTS } from '../config/texts';

const STEP_NUMBERS = Array.from({ length: ORDER_STEPS_TOTAL }, (_, index) => index + 1);

type OrderHeaderProps = {
  orderId: number;
  step: OrderStep;
};

// The stage as the title. On a phone the number of the order stands above it, on the desktop next
// to it; the title comes first for screen readers either way.
export function OrderHeader({ orderId, step }: OrderHeaderProps) {
  return (
    <header className="flex flex-col gap-2 lg:gap-4">
      <div className="flex flex-col-reverse gap-2 lg:flex-row lg:flex-wrap lg:items-baseline lg:gap-4">
        <PageTitle>{step.title}</PageTitle>
        <span className="text-small text-fg-secondary tabular-nums">
          {ORDER_TEXTS.orderNumber(formatOrderNumber(orderId))}
        </span>
      </div>
      <div className="flex flex-col gap-2 lg:max-w-120">
        <div aria-hidden="true" className="grid grid-cols-3 gap-1">
          {STEP_NUMBERS.map((number) => (
            <span
              key={number}
              className={joinClassNames(
                'h-1 rounded-full',
                number <= step.number ? 'bg-accent' : 'bg-border',
              )}
            />
          ))}
        </div>
        <span className="text-caption text-fg-secondary tabular-nums">
          {ORDER_STEP_TEXTS.step(step.number, ORDER_STEPS_TOTAL)}
        </span>
      </div>
    </header>
  );
}
