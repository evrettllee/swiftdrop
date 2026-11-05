import { DotsThreeIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { formatOrderNumber } from '@/entities/order';
import { ORDER_ACTION, type OrderAction } from '@/features/manager-order-actions';
import { COLOR_TRANSITION_CLASS, ICON_SIZE } from '@/shared/config';
import { getManagerOrderPath } from '@/shared/routes';
import type { ManagerOrderListItem } from '@/shared/staff-api';
import { Popover, POPOVER_ALIGN, POPOVER_KIND } from '@/shared/ui/popover';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';
import { canAssignRow, canCancelRow, type RowAction } from '../lib/row-actions';

const ITEM_BASE_CLASS = `flex min-h-11 w-full items-center px-4 text-start text-body outline-none hover:bg-surface-muted focus-visible:bg-surface-muted ${COLOR_TRANSITION_CLASS}`;
const ITEM_CLASS = `${ITEM_BASE_CLASS} text-fg`;

type RowMenuProps = {
  order: ManagerOrderListItem;
  onAction: RowAction;
};

export function RowMenu({ order, onAction }: RowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const label = MANAGER_ORDERS_TEXTS.actions(formatOrderNumber(order.id));

  function choose(action: OrderAction): void {
    setIsOpen(false);
    onAction(order, action);
  }

  return (
    <div className="relative z-10 inline-flex">
      <Popover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        label={label}
        align={POPOVER_ALIGN.END}
        kind={POPOVER_KIND.MENU}
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
        <Link role="menuitem" to={getManagerOrderPath(order.id)} className={ITEM_CLASS}>
          {MANAGER_ORDERS_TEXTS.OPEN_ORDER}
        </Link>
        {canAssignRow(order) ? (
          <button
            type="button"
            role="menuitem"
            className={ITEM_CLASS}
            onClick={() => choose(ORDER_ACTION.ASSIGN)}
          >
            {MANAGER_ORDERS_TEXTS.ASSIGN_COURIER}
          </button>
        ) : null}
        {canCancelRow(order) ? (
          <button
            type="button"
            role="menuitem"
            className={`${ITEM_BASE_CLASS} text-danger`}
            onClick={() => choose(ORDER_ACTION.CANCEL)}
          >
            {MANAGER_ORDERS_TEXTS.CANCEL_ORDER}
          </button>
        ) : null}
      </Popover>
    </div>
  );
}
