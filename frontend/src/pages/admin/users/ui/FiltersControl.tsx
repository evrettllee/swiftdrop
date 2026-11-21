import { FunnelIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { COUNT_BADGE_PLACEMENT, CountBadge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Sheet } from '@/shared/ui/dialog';
import { Popover } from '@/shared/ui/popover';
import type { UsersParams } from '../config/list-params';
import { ADMIN_USERS_TEXTS as TEXTS } from '../config/texts';
import type { FiltersDraft } from '../model/useFiltersDraft';
import { filtersCount } from '../model/users-view';
import { FiltersPanel } from './FiltersPanel';

type FiltersControlProps = {
  values: UsersParams;
  isDesktop: boolean;
  onApply: (patch: Partial<UsersParams>) => void;
};

export function FiltersControl({ values, isDesktop, onApply }: FiltersControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const icon = <FunnelIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />;
  const label = (
    <>
      {TEXTS.FILTERS}
      <CountBadge count={filtersCount(values)} placement={COUNT_BADGE_PLACEMENT.INLINE} />
    </>
  );

  function apply(draft: FiltersDraft): void {
    onApply({ status: draft.status, vehicle: draft.vehicle });
    setIsOpen(false);
  }

  if (isDesktop) {
    return (
      <Popover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        label={TEXTS.FILTERS_PANEL}
        panelClassName="w-110"
        trigger={(props) => (
          <Button variant="secondary" icon={icon} {...props}>
            {label}
          </Button>
        )}
      >
        {isOpen ? <FiltersPanel values={values} isSheet={false} onApply={apply} /> : null}
      </Popover>
    );
  }

  return (
    <>
      <div className="flex min-w-0 grow basis-0 *:grow">
        <Button
          variant="secondary"
          icon={icon}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
        >
          {label}
        </Button>
      </div>
      <Sheet isOpen={isOpen} onClose={() => setIsOpen(false)} title={TEXTS.FILTERS}>
        {isOpen ? <FiltersPanel values={values} isSheet onApply={apply} /> : null}
      </Sheet>
    </>
  );
}
