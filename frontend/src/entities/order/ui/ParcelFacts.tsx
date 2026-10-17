import { WarningIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { PARCEL_FACT_TEXTS } from '../config/texts';
import { formatParcelSize, formatParcelWeight } from '../lib/parcel-format';

// On a phone the facts are two columns, as in the design; on the desktop they are rows with the
// value at the end.
const FACT_LAYOUT_CLASS =
  'min-w-0 flex-col lg:flex-row lg:items-baseline lg:justify-between lg:gap-4 lg:text-small';
const VALUE_CLASS = 'font-semibold tabular-nums lg:text-end';

type ParcelFactsProps = {
  children: ReactNode;
};

// The facts of a parcel as a list; the page puts in it the rows it needs.
export function ParcelFacts({ children }: ParcelFactsProps) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-4 lg:flex lg:flex-col lg:gap-2">{children}</dl>
  );
}

type ParcelFactProps = {
  label: string;
  // The display of the row: "flex" unless the page hides it somewhere, for example "hidden lg:flex".
  className?: string;
  children: ReactNode;
};

export function ParcelFact({ label, className = 'flex', children }: ParcelFactProps) {
  return (
    <div className={`${FACT_LAYOUT_CLASS} ${className}`}>
      <dt className="text-small text-fg-secondary">{label}</dt>
      <dd className={VALUE_CLASS}>{children}</dd>
    </div>
  );
}

type ParcelBasicFactsProps = {
  parcel: Parameters<typeof formatParcelSize>[0] & { isFragile: boolean };
};

// The weight, the size and the fragility: what every page of an order says of its parcel.
export function ParcelBasicFacts({ parcel }: ParcelBasicFactsProps) {
  return (
    <>
      <ParcelFact label={PARCEL_FACT_TEXTS.WEIGHT}>{formatParcelWeight(parcel)}</ParcelFact>
      <ParcelFact label={PARCEL_FACT_TEXTS.SIZE}>{formatParcelSize(parcel)}</ParcelFact>
      <div className={`flex ${FACT_LAYOUT_CLASS}`}>
        <dt className="text-small text-fg-secondary">{PARCEL_FACT_TEXTS.FRAGILE}</dt>
        {parcel.isFragile ? (
          <dd className="flex items-center gap-1 font-semibold text-warning">
            <WarningIcon size={ICON_SIZE.SMALL} weight={ICON_WEIGHT} aria-hidden="true" />
            {PARCEL_FACT_TEXTS.YES}
          </dd>
        ) : (
          <dd className="font-semibold">{PARCEL_FACT_TEXTS.NO}</dd>
        )}
      </div>
    </>
  );
}
