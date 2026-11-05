import { PackageIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { formatOrderNumber } from '@/entities/order';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { useMinuteNow } from '@/shared/lib/clock';
import { Select, type SelectOption } from '@/shared/ui/select';
import type { RecentOrder } from '../api/recent-orders';
import { NEW_TICKET_TEXTS } from '../config/new-ticket';
import { SUPPORT_TEXTS } from '../config/texts';
import { withChosenOrder } from '../lib/new-ticket';
import { orderSummary } from '../lib/ticket-lines';

const NO_ORDER = '';

function unknownOrder(orderId: number): RecentOrder {
  return { orderId, status: null, at: null, address: null };
}

type OrderFieldProps = {
  orders: readonly RecentOrder[];
  value: number | null;
  onChange: (orderId: number | null) => void;
};

export function OrderField({ orders, value, onChange }: OrderFieldProps) {
  const [isPicking, setIsPicking] = useState(false);
  const now = new Date(useMinuteNow());
  const choices = withChosenOrder(orders, value, unknownOrder);
  const chosen = choices.find((order) => order.orderId === value) ?? null;

  if (chosen !== null && !isPicking) {
    const title = SUPPORT_TEXTS.orderNumber(formatOrderNumber(chosen.orderId));

    return (
      <div className="flex flex-col gap-2">
        <span className="text-small font-semibold text-fg">{NEW_TICKET_TEXTS.ORDER}</span>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
          <PackageIcon
            size={ICON_SIZE.MEDIUM}
            weight={ICON_WEIGHT}
            aria-hidden="true"
            className="shrink-0 text-fg-secondary"
          />
          <div className="flex min-w-0 grow flex-col">
            <span className="font-semibold text-fg tabular-nums">{title}</span>
            <span className="hidden truncate text-small text-fg-secondary lg:block">
              {orderSummary(chosen, now, true)}
            </span>
            <span className="truncate text-small text-fg-secondary lg:hidden">
              {orderSummary(chosen, now, false)}
            </span>
          </div>
          <button
            type="button"
            aria-label={`${NEW_TICKET_TEXTS.CHANGE}: ${title}`}
            onClick={() => setIsPicking(true)}
            className="-my-3 -me-2 inline-flex min-h-11 shrink-0 items-center rounded-sm px-2 font-semibold text-accent hover:underline"
          >
            {NEW_TICKET_TEXTS.CHANGE}
          </button>
        </div>
      </div>
    );
  }

  const options: SelectOption<string>[] = [
    { value: NO_ORDER, label: NEW_TICKET_TEXTS.NO_ORDER },
    ...choices.map((order) => ({
      value: String(order.orderId),
      label: NEW_TICKET_TEXTS.orderLine(
        [
          SUPPORT_TEXTS.orderNumber(formatOrderNumber(order.orderId)),
          orderSummary(order, now, false),
        ].filter((part) => part !== ''),
      ),
    })),
  ];

  return (
    <Select
      label={NEW_TICKET_TEXTS.ORDER}
      options={options}
      value={value === null ? NO_ORDER : String(value)}
      onChange={(next) => {
        setIsPicking(false);
        onChange(next === NO_ORDER ? null : Number(next));
      }}
    />
  );
}
