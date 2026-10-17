import { useEffect, useRef } from 'react';
import { formatOrderNumber } from '@/entities/order';
import { joinClassNames } from '@/shared/lib/class-names';
import { PageTitle } from '@/shared/ui/page-title';
import { ORDER_STEPS_TOTAL, type OrderStep } from '../config/order-steps';
import { ORDER_STEP_TEXTS, ORDER_TEXTS } from '../config/texts';

const STEP_NUMBERS = Array.from({ length: ORDER_STEPS_TOTAL }, (_, index) => index + 1);

// The title takes the focus by a script only: no ring around it, the text itself is the answer.
const TITLE_CLASS = 'focus-visible:outline-none';

// The focus is lost when the element that had it is gone or is disabled while it works.
function isFocusLost(): boolean {
  const active = document.activeElement;

  return (
    active === null ||
    active === document.body ||
    (active instanceof HTMLButtonElement && active.disabled)
  );
}

// Called by React when the title appears.
function focusElement(element: HTMLElement | null): void {
  element?.focus();
}

type OrderHeaderProps = {
  orderId: number;
  step: OrderStep;
  // The screen comes after another one whose button had the focus: the title takes it.
  isFocusOnMount: boolean;
};

// The stage as the title, in a status region: a new stage is announced once. When the stage
// changes and the focus is nowhere, the title takes it. On a phone the number of the order stands
// above it, on the desktop next to it; the title comes first for screen readers either way.
export function OrderHeader({ orderId, step, isFocusOnMount }: OrderHeaderProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step.number);

  useEffect(() => {
    if (shownStep.current !== step.number) {
      shownStep.current = step.number;

      if (isFocusLost()) {
        titleRef.current?.focus();
      }
    }
  }, [step.number]);

  return (
    <header className="flex flex-col gap-2 lg:gap-4">
      <div className="flex flex-col-reverse gap-2 lg:flex-row lg:flex-wrap lg:items-baseline lg:gap-4">
        <div role="status">
          <PageTitle
            ref={(element) => {
              titleRef.current = element;

              if (isFocusOnMount) {
                focusElement(element);
              }
            }}
            tabIndex={-1}
            className={TITLE_CLASS}
          >
            {step.title}
          </PageTitle>
        </div>
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
