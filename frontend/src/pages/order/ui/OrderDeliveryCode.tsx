import { useId } from 'react';
import { ORDER_COURIER_TEXTS } from '../config/tracking';

type OrderDeliveryCodeProps = {
  code: string;
};

// The code the courier asks for at the handover. It is read out as one group, digit by digit, and
// it is not in a live region, so a screen reader does not say it by itself.
export function OrderDeliveryCode({ code }: OrderDeliveryCodeProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="order-first flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-md lg:p-6 dark:border dark:border-border"
    >
      <h2 id={headingId} className="text-heading-sm font-semibold text-balance">
        {ORDER_COURIER_TEXTS.CODE_SECTION}
      </h2>
      <div
        role="group"
        aria-label={ORDER_COURIER_TEXTS.codeLabel(code)}
        className="grid auto-cols-fr grid-flow-col gap-2"
      >
        {Array.from(code).map((digit, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="grid h-14 place-items-center rounded-sm bg-selected text-heading-lg font-bold tabular-nums"
          >
            {digit}
          </span>
        ))}
      </div>
      <p className="text-small text-pretty text-fg-secondary">{ORDER_COURIER_TEXTS.CODE_HINT}</p>
    </section>
  );
}
