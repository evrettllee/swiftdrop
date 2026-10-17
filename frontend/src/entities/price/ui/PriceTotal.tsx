import { PRICE_TEXTS } from '../config/texts';

type PriceTotalProps = {
  // The formatted amount, for example "12,50 BYN".
  value: string;
};

// The last line of a price block: "Итого" and the large amount.
export function PriceTotal({ value }: PriceTotalProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="font-semibold">{PRICE_TEXTS.TOTAL}</span>
      <span className="text-heading-lg font-bold tabular-nums">{value}</span>
    </div>
  );
}
