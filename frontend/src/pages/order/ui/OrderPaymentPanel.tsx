import { memo, useId } from 'react';
import { DeliveryPriceRows, formatDistanceKm, PRICE_TEXTS, PriceTotal } from '@/entities/price';
import type { OrderDetails } from '@/shared/api';
import { formatMoney } from '@/shared/lib/format';
import { Divider } from '@/shared/ui/divider';
import { PriceRow } from '@/shared/ui/price-row';
import { PAYMENT_TEXTS } from '../config/texts';
import { getTravelMinutes } from '../lib/payment';
import { OrderPaymentActions } from './OrderPaymentActions';
import { PaymentStatusRow } from './PaymentStatusRow';
import { RepeatOrderAction } from './RepeatOrderAction';

type OrderPaymentPanelProps = {
  order: OrderDetails;
  // The last payment attempt did not go through: the pay button offers to try again.
  isPayFailed: boolean;
  // Opens the cancel dialog; the button is hidden until it is given.
  onCancel?: () => void;
};

export const OrderPaymentPanel = memo(function OrderPaymentPanel({
  order,
  isPayFailed,
  onCancel,
}: OrderPaymentPanelProps) {
  const headingId = useId();
  const minutes = getTravelMinutes(order);
  const total = formatMoney(order.price, order.currency);

  return (
    <aside
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-md lg:p-6 dark:border dark:border-border"
    >
      <h2 id={headingId} className="text-heading-sm font-semibold text-balance">
        {PAYMENT_TEXTS.SECTION}
      </h2>
      <PaymentStatusRow order={order} />
      <Divider />
      <dl className="flex flex-col gap-2 text-small">
        <PriceRow label={PRICE_TEXTS.DISTANCE} value={formatDistanceKm(order.distanceKm)} />
        {minutes === null ? null : (
          <PriceRow label={PRICE_TEXTS.TRAVEL_TIME} value={PRICE_TEXTS.travelTime(minutes)} />
        )}
        <DeliveryPriceRows
          price={order.price}
          coefficient={order.priceCoefficient}
          currency={order.currency}
        />
      </dl>
      <Divider />
      <PriceTotal value={total} />
      <OrderPaymentActions
        order={order}
        total={total}
        isPayFailed={isPayFailed}
        onCancel={onCancel}
      />
      <RepeatOrderAction order={order} />
    </aside>
  );
});
