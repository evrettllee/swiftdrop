import { FunnelIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { COUNT_BADGE_PLACEMENT, CountBadge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Sheet } from '@/shared/ui/dialog';
import { Popover } from '@/shared/ui/popover';
import type { OrdersParams } from '../config/list-params';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';
import type { OrdersView } from '../model/orders-view';
import { FILTERS_FORM_LAYOUT } from '../config/filters-form';
import { FiltersForm } from './FiltersForm';

type FiltersControlProps = {
  view: OrdersView;
  courierName: string | null;
  isDesktop: boolean;
  onApply: (patch: Partial<OrdersParams>) => void;
  onCourierChosen: (courierId: number, name: string) => void;
};

export function FiltersControl({
  view,
  courierName,
  isDesktop,
  onApply,
  onCourierChosen,
}: FiltersControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const icon = <FunnelIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />;
  const label = (
    <>
      {MANAGER_ORDERS_TEXTS.FILTERS}
      <CountBadge count={view.filtersCount} placement={COUNT_BADGE_PLACEMENT.INLINE} />
    </>
  );

  function apply(
    patch: Partial<OrdersParams>,
    courier: { courierId: number; name: string } | null,
  ): void {
    if (courier !== null) {
      onCourierChosen(courier.courierId, courier.name);
    }

    onApply(patch);
    setIsOpen(false);
  }

  const form = (
    <FiltersForm
      view={view}
      courierName={courierName}
      layout={isDesktop ? FILTERS_FORM_LAYOUT.PANEL : FILTERS_FORM_LAYOUT.SHEET}
      onApply={apply}
    />
  );

  if (isDesktop) {
    return (
      <Popover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        label={MANAGER_ORDERS_TEXTS.FILTERS_PANEL}
        panelClassName="w-110"
        trigger={(props) => (
          <Button variant="secondary" icon={icon} {...props}>
            {label}
          </Button>
        )}
      >
        {form}
      </Popover>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        icon={icon}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        {label}
      </Button>
      <Sheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={MANAGER_ORDERS_TEXTS.FILTERS_SHEET}
      >
        {isOpen ? form : null}
      </Sheet>
    </>
  );
}
