import { formatOrderNumber } from '@/entities/order';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { ORDER_ACTION, type OrderAction } from '../config/actions';
import { ACTION_TEXTS } from '../config/texts';

const TITLES: Record<OrderAction, (orderNumber: string) => string> = {
  [ORDER_ACTION.ASSIGN]: ACTION_TEXTS.assignTitle,
  [ORDER_ACTION.RESTART]: ACTION_TEXTS.restartTitle,
  [ORDER_ACTION.REASSIGN]: ACTION_TEXTS.reassignTitle,
  [ORDER_ACTION.CANCEL]: ACTION_TEXTS.cancelTitle,
};

type ActionDialogProps = {
  orderId: number;
  action: OrderAction;
  isOpen: boolean;
  onClose: () => void;
};

export function ActionDialog({ orderId, action, isOpen, onClose }: ActionDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={TITLES[action](formatOrderNumber(orderId))}
      actions={
        <Button variant="secondary" onClick={onClose}>
          {ACTION_TEXTS.CLOSE}
        </Button>
      }
    >
      {null}
    </Dialog>
  );
}
