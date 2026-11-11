import { formatOrderNumber } from '@/entities/order';
import { restartAssignment } from '@/shared/staff-api';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { ASSIGN_TEXTS, DONE_TEXTS, RESTART_TEXTS } from '../config/texts';
import { toReason } from '../lib/reason';
import {
  expectedCourierId,
  hasAssignedCourier,
  type StaffOrderTarget,
} from '../model/order-target';
import { useReasonAction } from '../model/useReasonAction';
import { FailureAlert } from './FailureAlert';
import { ReasonField } from './ReasonField';

type RestartAssignmentDialogProps = {
  target: StaffOrderTarget;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
};

export function RestartAssignmentDialog({
  target,
  isOpen,
  onClose,
  onChanged,
}: RestartAssignmentDialogProps) {
  const orderNumber = formatOrderNumber(target.orderId);
  const withCourier = hasAssignedCourier(target);
  const restart = useReasonAction({
    run: (reasonText) =>
      restartAssignment(target.orderId, expectedCourierId(target), toReason(reasonText)),
    toastOf: () => ({ title: DONE_TEXTS.RESTARTED, text: DONE_TEXTS.restarted(orderNumber) }),
    toastKey: `order-action-${target.orderId}`,
    onClose,
    onChanged,
  });

  return (
    <Dialog
      width="large"
      hasDividers
      isOpen={isOpen}
      onClose={onClose}
      title={RESTART_TEXTS.title(orderNumber)}
      actions={
        <>
          <Button
            variant={withCourier ? 'danger' : 'primary'}
            loading={restart.action.isSubmitting}
            onClick={() => void restart.submit()}
          >
            {RESTART_TEXTS.SUBMIT}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {RESTART_TEXTS.CANCEL}
          </Button>
        </>
      }
    >
      <p className="text-fg">
        {withCourier && target.courier !== null
          ? RESTART_TEXTS.withCourier(target.courier.name)
          : RESTART_TEXTS.WAITING}
      </p>
      <ReasonField
        value={restart.reasonText}
        hint={ASSIGN_TEXTS.REASON_OPTIONAL_HINT}
        error={restart.fieldError}
        onChange={restart.setReasonText}
      />
      <FailureAlert
        failure={restart.action.failure}
        isFieldShown
        onRetry={() => void restart.submit()}
        onRefresh={restart.refresh}
      />
    </Dialog>
  );
}
