import { CalendarBlankIcon, CaretDownIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import type { Period } from '@/shared/lib/calendar';
import { Sheet } from '@/shared/ui/dialog';
import { Popover, type PopoverTriggerProps } from '@/shared/ui/popover';
import type { OrdersQuery } from '../api/list-orders';
import { FILTER_TEXTS } from '../config/texts';
import { periodButtonLabel } from '../lib/period-labels';
import { PeriodForm } from './PeriodForm';

const TRIGGER_CLASS = `inline-flex min-h-11 min-w-0 items-center gap-2 rounded-md border border-border bg-surface px-3 text-body hover:bg-surface-muted aria-expanded:border-accent lg:px-4 ${COLOR_TRANSITION_CLASS}`;

type PeriodControlProps = {
  query: OrdersQuery;
  now: Date;
  isDesktop: boolean;
  onApply: (period: Period) => void;
};

export function PeriodControl({ query, now, isDesktop, onApply }: PeriodControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const label = periodButtonLabel(query, now, isDesktop);

  function apply(period: Period): void {
    onApply(period);
    setIsOpen(false);
  }

  const trigger = (props: Partial<PopoverTriggerProps>) => (
    <button
      type="button"
      aria-label={`${FILTER_TEXTS.PERIOD}: ${label}`}
      className={`${TRIGGER_CLASS} ${isDesktop ? '' : 'grow justify-between'}`}
      {...props}
    >
      {isDesktop ? (
        <CalendarBlankIcon
          size={ICON_SIZE.MEDIUM}
          weight={ICON_WEIGHT}
          aria-hidden="true"
          className="shrink-0 text-fg-secondary"
        />
      ) : null}
      <span className="truncate">{label}</span>
      <CaretDownIcon
        size={ICON_SIZE.SMALL}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="shrink-0 text-fg-secondary"
      />
    </button>
  );

  if (isDesktop) {
    return (
      <Popover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        label={FILTER_TEXTS.PERIOD}
        panelClassName="w-100"
        trigger={trigger}
      >
        <PeriodForm query={query} now={now} layout="panel" onApply={apply} />
      </Popover>
    );
  }

  return (
    <>
      {trigger({
        'aria-haspopup': 'dialog',
        'aria-expanded': isOpen,
        onClick: () => setIsOpen(true),
      })}
      <Sheet isOpen={isOpen} onClose={() => setIsOpen(false)} title={FILTER_TEXTS.PERIOD}>
        {isOpen ? <PeriodForm query={query} now={now} layout="sheet" onApply={apply} /> : null}
      </Sheet>
    </>
  );
}
