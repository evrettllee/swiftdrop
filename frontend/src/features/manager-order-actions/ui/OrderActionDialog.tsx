import { useState } from 'react';
import { ORDER_ACTION, type OrderAction } from '../config/actions';
import type { StaffOrderTarget } from '../model/order-target';
import { AssignCourierDialog } from './AssignCourierDialog';
import { CancelOrderDialog } from './CancelOrderDialog';
import { RestartAssignmentDialog } from './RestartAssignmentDialog';

type OrderActionDialogProps = {
  target: StaffOrderTarget | null;
  action: OrderAction | null;
  onClose: () => void;
  onChanged: () => void;
};

type Session = {
  id: number;
  isOpen: boolean;
  target: StaffOrderTarget | null;
  action: OrderAction | null;
};

export function OrderActionDialog({ target, action, onClose, onChanged }: OrderActionDialogProps) {
  const isOpen = target !== null && action !== null;
  const [session, setSession] = useState<Session>({ id: 0, isOpen: false, target, action });

  if (isOpen !== session.isOpen) {
    setSession({
      id: isOpen && !session.isOpen ? session.id + 1 : session.id,
      isOpen,
      target: isOpen ? target : session.target,
      action: isOpen ? action : session.action,
    });
  }

  const shownTarget = isOpen ? target : session.target;
  const shownAction = isOpen ? action : session.action;

  if (shownTarget === null || shownAction === null) {
    return null;
  }

  const props = { target: shownTarget, isOpen, onClose, onChanged };

  switch (shownAction) {
    case ORDER_ACTION.ASSIGN:
    case ORDER_ACTION.REASSIGN:
      return (
        <AssignCourierDialog
          key={session.id}
          isReassign={shownAction === ORDER_ACTION.REASSIGN}
          {...props}
        />
      );
    case ORDER_ACTION.RESTART:
      return <RestartAssignmentDialog key={session.id} {...props} />;
    default:
      return <CancelOrderDialog key={session.id} {...props} />;
  }
}
