import { CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import { type ReactNode, useId } from 'react';
import type { OrderDetails } from '@/shared/api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatTime } from '@/shared/lib/format';
import { PROGRESS_STATE } from '../config/progress';
import { ORDER_DETAILS_TEXTS } from '../config/texts';
import { buildProgress } from '../lib/progress';
import type { ProgressState } from '../model/order-progress';

function StepIcon({ state }: { state: ProgressState }) {
  let icon: ReactNode = (
    <span aria-hidden="true" className="size-5 shrink-0 rounded-full border border-fg-muted" />
  );

  if (state === PROGRESS_STATE.DONE || state === PROGRESS_STATE.CURRENT) {
    icon = (
      <CheckCircleIcon
        size={ICON_SIZE.MEDIUM}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="shrink-0 text-accent"
      />
    );
  } else if (state === PROGRESS_STATE.STOPPED) {
    icon = (
      <XCircleIcon
        size={ICON_SIZE.MEDIUM}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="shrink-0 text-danger"
      />
    );
  }

  return icon;
}

type OrderProgressProps = {
  order: OrderDetails;
};

// "Ход заказа": the passed steps with a check and the time, the current one in bold.
export function OrderProgress({ order }: OrderProgressProps) {
  const headingId = useId();
  const steps = buildProgress(order);

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId} className="text-heading-sm font-semibold text-balance">
        {ORDER_DETAILS_TEXTS.SECTION_PROGRESS}
      </h2>
      <ol className="flex flex-col gap-3">
        {steps.map((step) => {
          const isTodo = step.state === PROGRESS_STATE.TODO;
          const isBold =
            step.state === PROGRESS_STATE.CURRENT || step.state === PROGRESS_STATE.STOPPED;

          return (
            <li
              key={step.key}
              className={`flex items-center gap-3 ${isTodo ? 'text-fg-secondary' : ''}`}
            >
              <StepIcon state={step.state} />
              <span className={`min-w-0 flex-1 ${isBold ? 'font-semibold' : ''}`}>
                {step.label}
              </span>
              {step.time === null ? null : (
                <span className="text-small text-fg-secondary tabular-nums">
                  {formatTime(step.time)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
