import {
  ArrowClockwiseIcon,
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@phosphor-icons/react';
import { useId } from 'react';
import { formatCoefficient, formatDistanceKm, PRICE_TEXTS } from '@/entities/price';
import { saveOrderDraft } from '@/features/order-draft';
import { ORDER_STATUS, type OrderDetails } from '@/shared/api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatMoney, formatShortDateTime } from '@/shared/lib/format';
import { APP_ROUTES } from '@/shared/routes';
import { Button, LinkButton } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { PriceRow } from '@/shared/ui/price-row';
import { PAYMENT_VIEW } from '../config/payment';
import { PAYMENT_TEXTS } from '../config/texts';
import {
  getPaidAt,
  getPaymentView,
  getPriceBreakdown,
  getStatusReachedAt,
  getTravelMinutes,
} from '../lib/payment';
import { buildRepeatDraft } from '../lib/repeat-order';
import { CANCELLABLE_STATUSES, FINISHED_STATUSES } from '../model/order-status-groups';
import { useOrderPayment } from '../model/useOrderPayment';

const DIVIDER = <hr className="border-border" />;
const ICON_PROPS = { size: ICON_SIZE.MEDIUM, weight: ICON_WEIGHT, 'aria-hidden': true } as const;

type OrderPaymentPanelProps = {
  order: OrderDetails;
  // The last payment attempt did not go through: the pay button offers to try again.
  isPayFailed: boolean;
  // Opens the cancel dialog; the button is hidden until it is given.
  onCancel?: () => void;
};

export function OrderPaymentPanel({ order, isPayFailed, onCancel }: OrderPaymentPanelProps) {
  const headingId = useId();
  const payment = useOrderPayment(order.orderId);
  const view = getPaymentView(order);
  const paidAt = getPaidAt(order);
  const minutes = getTravelMinutes(order);
  const { base, surcharge } = getPriceBreakdown(order);
  const total = formatMoney(order.price, order.currency);
  const isPending = order.status === ORDER_STATUS.PENDING;
  const isCancellable = CANCELLABLE_STATUSES.includes(order.status) && onCancel !== undefined;
  const isFinished = FINISHED_STATUSES.includes(order.status);

  // The client is signed in already, so the order form is not awaited after a sign-in.
  function handleRepeat(): void {
    saveOrderDraft(buildRepeatDraft(order), { pendingCheckout: false });
  }

  let statusRow = (
    <div className="flex items-center gap-2">
      <ClockIcon {...ICON_PROPS} className="shrink-0 text-fg-secondary" />
      <span className="font-semibold">{PAYMENT_TEXTS.UNPAID}</span>
    </div>
  );

  if (view === PAYMENT_VIEW.PAID) {
    statusRow = (
      <div className="flex items-center gap-2">
        <CheckCircleIcon {...ICON_PROPS} className="shrink-0 text-success" />
        <span className="font-semibold">{PAYMENT_TEXTS.PAID}</span>
        {paidAt === null ? null : (
          <span className="ms-auto text-small text-fg-secondary tabular-nums">
            {formatShortDateTime(paidAt)}
          </span>
        )}
      </div>
    );
  } else if (view === PAYMENT_VIEW.REFUNDED) {
    // The money goes back when the order is cancelled.
    const refundedAt = getStatusReachedAt(order);

    statusRow = (
      <div className="flex items-center gap-2">
        <ArrowsClockwiseIcon {...ICON_PROPS} className="shrink-0 text-fg-secondary" />
        <span className="font-semibold">{PAYMENT_TEXTS.REFUNDED}</span>
        {refundedAt === null ? null : (
          <span className="ms-auto text-small text-fg-secondary tabular-nums">
            {formatShortDateTime(refundedAt)}
          </span>
        )}
      </div>
    );
  }

  return (
    <aside
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-md lg:p-6 dark:border dark:border-border"
    >
      <h2 id={headingId} className="text-heading-sm font-semibold text-balance">
        {PAYMENT_TEXTS.SECTION}
      </h2>
      {statusRow}
      {DIVIDER}
      <dl className="flex flex-col gap-2 text-small">
        <PriceRow label={PRICE_TEXTS.DISTANCE} value={formatDistanceKm(order.distanceKm)} />
        {minutes === null ? null : (
          <PriceRow label={PRICE_TEXTS.TRAVEL_TIME} value={PRICE_TEXTS.travelTime(minutes)} />
        )}
        <PriceRow label={PRICE_TEXTS.DELIVERY} value={formatMoney(base, order.currency)} />
        {surcharge === null ? null : (
          <PriceRow
            label={PRICE_TEXTS.surcharge(formatCoefficient(order.priceCoefficient))}
            value={PRICE_TEXTS.extra(formatMoney(surcharge, order.currency))}
          />
        )}
      </dl>
      {DIVIDER}
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-semibold">{PRICE_TEXTS.TOTAL}</span>
        <span className="text-heading-lg font-bold tabular-nums">{total}</span>
      </div>
      {isPending || isCancellable ? (
        <>
          {DIVIDER}
          {payment.message === null ? null : (
            <InlineAlert variant="error">{payment.message}</InlineAlert>
          )}
          {isPending ? (
            <Button
              fullWidth
              loading={payment.isPaying}
              icon={
                isPayFailed ? (
                  <ArrowClockwiseIcon {...ICON_PROPS} className="shrink-0" />
                ) : undefined
              }
              onClick={() => void payment.pay()}
            >
              {isPayFailed ? PAYMENT_TEXTS.RETRY_PAY : PAYMENT_TEXTS.pay(total)}
            </Button>
          ) : null}
          {isCancellable ? (
            <Button variant="secondary" fullWidth onClick={onCancel}>
              {PAYMENT_TEXTS.CANCEL}
            </Button>
          ) : null}
          {isCancellable && !isPending ? (
            <p className="text-caption text-pretty text-fg-secondary">
              {PAYMENT_TEXTS.CANCEL_HINT}
            </p>
          ) : null}
        </>
      ) : null}
      {isFinished ? (
        <>
          {DIVIDER}
          <LinkButton
            to={APP_ROUTES.ORDER_NEW}
            onClick={handleRepeat}
            fullWidth
            icon={<ArrowsClockwiseIcon {...ICON_PROPS} className="shrink-0" />}
          >
            {PAYMENT_TEXTS.REPEAT}
          </LinkButton>
          <p className="text-caption text-pretty text-fg-secondary">{PAYMENT_TEXTS.REPEAT_HINT}</p>
        </>
      ) : null}
    </aside>
  );
}
