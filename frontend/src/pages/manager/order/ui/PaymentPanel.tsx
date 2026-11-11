import { PaymentStatusRow } from '@/entities/order';
import { DeliveryPriceRows, formatDistanceKm, PRICE_TEXTS, PriceTotal } from '@/entities/price';
import { APP_CURRENCY } from '@/shared/config';
import { formatMoney } from '@/shared/lib/format';
import { PAYMENT_STATE, type ManagerOrderDetails } from '@/shared/staff-api';
import { Divider } from '@/shared/ui/divider';
import { PriceRow } from '@/shared/ui/price-row';
import { MANAGER_ORDER_TEXTS } from '../config/texts';
import { Panel } from './Panel';

type PaymentPanelProps = {
  order: ManagerOrderDetails;
  className?: string;
};

export function PaymentPanel({ order, className = '' }: PaymentPanelProps) {
  const { payment, pricing } = order;
  const time = payment.state === PAYMENT_STATE.REFUNDED ? payment.refundedAt : payment.paidAt;

  return (
    <Panel title={MANAGER_ORDER_TEXTS.SECTION_PAYMENT} className={className}>
      <PaymentStatusRow view={payment.state} time={time} />
      <Divider />
      <dl className="flex flex-col gap-2 text-small">
        <PriceRow label={MANAGER_ORDER_TEXTS.TARIFF} value={pricing.tariffName} />
        <PriceRow label={PRICE_TEXTS.DISTANCE} value={formatDistanceKm(pricing.distanceKm)} />
        {pricing.estimatedMinutes === null ? null : (
          <PriceRow
            label={PRICE_TEXTS.TRAVEL_TIME}
            value={PRICE_TEXTS.travelTime(pricing.estimatedMinutes)}
          />
        )}
        <DeliveryPriceRows
          price={pricing.price}
          coefficient={pricing.coefficient}
          currency={APP_CURRENCY}
        />
      </dl>
      <Divider />
      <PriceTotal value={formatMoney(pricing.price, APP_CURRENCY)} />
    </Panel>
  );
}
