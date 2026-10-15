import { formatMoney } from '@/shared/lib/format';
import { PriceRow } from '@/shared/ui/price-row';
import { PRICE_TEXTS } from '../config/texts';
import { formatCoefficient, splitPrice } from '../lib/price';

type DeliveryPriceRowsProps = {
  price: number;
  coefficient: number;
  currency: string;
};

// The delivery without the demand surcharge and the surcharge itself, if any (inside a <dl>).
export function DeliveryPriceRows({ price, coefficient, currency }: DeliveryPriceRowsProps) {
  const { base, surcharge } = splitPrice(price, coefficient);

  return (
    <>
      <PriceRow label={PRICE_TEXTS.DELIVERY} value={formatMoney(base, currency)} />
      {surcharge === null ? null : (
        <PriceRow
          label={PRICE_TEXTS.surcharge(formatCoefficient(coefficient))}
          value={PRICE_TEXTS.extra(formatMoney(surcharge, currency))}
        />
      )}
    </>
  );
}
