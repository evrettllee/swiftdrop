import { ORDER_ACTION } from '@/features/manager-order-actions';
import type { ManagerOrderListItem } from '@/shared/staff-api';
import { Button } from '@/shared/ui/button';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';
import { canAssignRow, type RowAction } from '../lib/row-actions';
import { RowMenu } from './RowMenu';

type RowActionsProps = {
  order: ManagerOrderListItem;
  hasAssign: boolean;
  onAction: RowAction;
};

export function RowActions({ order, hasAssign, onAction }: RowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      {hasAssign && canAssignRow(order) ? (
        <span className="relative z-10 inline-flex">
          <Button variant="secondary" onClick={() => onAction(order, ORDER_ACTION.ASSIGN)}>
            {MANAGER_ORDERS_TEXTS.ASSIGN}
          </Button>
        </span>
      ) : null}
      <RowMenu order={order} onAction={onAction} />
    </div>
  );
}
