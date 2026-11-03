import { ArrowClockwiseIcon, ArrowsLeftRightIcon, UserPlusIcon } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import type { ManagerOrderActions } from '@/shared/staff-api';
import { Button } from '@/shared/ui/button';
import { Divider } from '@/shared/ui/divider';
import { ORDER_ACTION, type OrderAction } from '@/features/manager-order-actions';
import { ACTION_TEXTS, MANAGER_ORDER_TEXTS } from '../config/texts';
import { Panel } from './Panel';

function iconOf(ActionIcon: Icon) {
  return <ActionIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />;
}

type ActionsPanelProps = {
  actions: ManagerOrderActions;
  className?: string;
  onAction: (action: OrderAction) => void;
};

export function ActionsPanel({ actions, className = '', onAction }: ActionsPanelProps) {
  const hasMain = actions.canAssign || actions.canRestartAutoAssign || actions.canReassign;

  return (
    <Panel title={MANAGER_ORDER_TEXTS.SECTION_ACTIONS} className={className}>
      {actions.canAssign ? (
        <Button fullWidth icon={iconOf(UserPlusIcon)} onClick={() => onAction(ORDER_ACTION.ASSIGN)}>
          {ACTION_TEXTS.ASSIGN}
        </Button>
      ) : null}
      {actions.canReassign ? (
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            fullWidth
            icon={iconOf(ArrowsLeftRightIcon)}
            onClick={() => onAction(ORDER_ACTION.REASSIGN)}
          >
            {ACTION_TEXTS.REASSIGN}
          </Button>
          <p className="text-caption text-pretty text-fg-secondary">{ACTION_TEXTS.REASSIGN_HINT}</p>
        </div>
      ) : null}
      {actions.canRestartAutoAssign ? (
        <Button
          variant="secondary"
          fullWidth
          icon={iconOf(ArrowClockwiseIcon)}
          onClick={() => onAction(ORDER_ACTION.RESTART)}
        >
          {ACTION_TEXTS.RESTART}
        </Button>
      ) : null}
      {hasMain && actions.canCancel ? <Divider /> : null}
      {actions.canCancel ? (
        <Button variant="secondary" fullWidth onClick={() => onAction(ORDER_ACTION.CANCEL)}>
          {ACTION_TEXTS.CANCEL}
        </Button>
      ) : null}
    </Panel>
  );
}
