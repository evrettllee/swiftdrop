import { CalendarBlankIcon, CaretDownIcon } from '@phosphor-icons/react';
import { type ReactNode, useState } from 'react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { Sheet } from '@/shared/ui/dialog';
import { Popover, type PopoverTriggerProps } from '@/shared/ui/popover';
import type { PeriodFormLayout } from './PeriodForm';

const TRIGGER_CLASS = `inline-flex min-h-11 min-w-0 items-center gap-2 rounded-md border border-border bg-surface px-3 text-body hover:bg-surface-muted aria-expanded:border-accent lg:px-4 ${COLOR_TRANSITION_CLASS}`;

type PeriodControlProps = {
  isDesktop: boolean;
  title: string;
  label: string;
  children: (layout: PeriodFormLayout, close: () => void) => ReactNode;
};

export function PeriodControl({ isDesktop, title, label, children }: PeriodControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  const trigger = (props: Partial<PopoverTriggerProps>) => (
    <button
      type="button"
      aria-label={`${title}: ${label}`}
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
        label={title}
        panelClassName="w-100"
        trigger={trigger}
      >
        {children('panel', close)}
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
      <Sheet isOpen={isOpen} onClose={close} title={title}>
        {isOpen ? children('sheet', close) : null}
      </Sheet>
    </>
  );
}
