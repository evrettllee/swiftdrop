import { CaretDownIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import type { VehicleType } from '@/shared/api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { COUNT_BADGE_PLACEMENT, CountBadge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Sheet } from '@/shared/ui/dialog';
import { Popover } from '@/shared/ui/popover';
import type { MapFilter } from '../config/map';
import { MANAGER_MAP_TEXTS as TEXTS } from '../config/texts';
import { VehicleFilterPanel } from './VehicleFilterPanel';

type VehicleFilterControlProps = {
  isDesktop: boolean;
  selected: readonly VehicleType[];
  state: MapFilter | null;
  search: string | null;
  committedCount: number | null;
  onApply: (vehicleTypes: VehicleType[]) => void;
};

export function VehicleFilterControl({
  isDesktop,
  selected,
  state,
  search,
  committedCount,
  onApply,
}: VehicleFilterControlProps) {
  const [isOpen, setIsOpen] = useState(false);

  function apply(vehicleTypes: VehicleType[]): void {
    onApply(vehicleTypes);
    setIsOpen(false);
  }

  const label = (
    <>
      {TEXTS.VEHICLE_FILTERS_LABEL}
      <CountBadge count={selected.length} placement={COUNT_BADGE_PLACEMENT.INLINE} />
      <CaretDownIcon
        size={ICON_SIZE.SMALL}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="ms-1 shrink-0"
      />
    </>
  );

  const panel = (isSheet: boolean) => (
    <VehicleFilterPanel
      selected={selected}
      state={state}
      search={search}
      committedCount={committedCount}
      isSheet={isSheet}
      onApply={apply}
    />
  );

  if (isDesktop) {
    return (
      <Popover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        label={TEXTS.VEHICLE_PANEL_LABEL}
        panelClassName="w-96"
        trigger={(props) => (
          <Button variant="secondary" {...props}>
            {label}
          </Button>
        )}
      >
        {isOpen ? panel(false) : null}
      </Popover>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        {label}
      </Button>
      <Sheet isOpen={isOpen} onClose={() => setIsOpen(false)} title={TEXTS.VEHICLE_FILTERS_LABEL}>
        {isOpen ? panel(true) : null}
      </Sheet>
    </>
  );
}
