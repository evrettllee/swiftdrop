import { DotsThreeIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { COLOR_TRANSITION_CLASS, ICON_SIZE } from '@/shared/config';
import { getManagerOrderPath } from '@/shared/routes';
import { Popover, POPOVER_ALIGN } from '@/shared/ui/popover';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';

type RowMenuProps = {
  orderId: number;
  orderNumber: string;
};

export function RowMenu({ orderId, orderNumber }: RowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const label = MANAGER_ORDERS_TEXTS.actions(orderNumber);

  return (
    <div className="relative z-10 inline-flex">
      <Popover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        label={label}
        align={POPOVER_ALIGN.END}
        panelClassName="w-56 py-1"
        trigger={(props) => (
          <button
            type="button"
            aria-label={label}
            {...props}
            className={`grid size-11 place-items-center rounded-md text-fg-secondary hover:bg-selected hover:text-fg ${COLOR_TRANSITION_CLASS}`}
          >
            <DotsThreeIcon size={ICON_SIZE.MEDIUM} weight="bold" aria-hidden="true" />
          </button>
        )}
      >
        <Link
          to={getManagerOrderPath(orderId)}
          className={`flex min-h-11 items-center px-4 text-start text-body text-fg hover:bg-surface-muted ${COLOR_TRANSITION_CLASS}`}
        >
          {MANAGER_ORDERS_TEXTS.OPEN_ORDER}
        </Link>
      </Popover>
    </div>
  );
}
