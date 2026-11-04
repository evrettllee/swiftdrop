import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { LEAVE_TEXTS } from '../config/texts';

type LeaveDialogProps = { isOpen: boolean; onLeave: () => void; onStay: () => void };

export function LeaveDialog({ isOpen, onLeave, onStay }: LeaveDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onStay}
      title={LEAVE_TEXTS.TITLE}
      actions={
        <>
          <Button variant="danger" onClick={onLeave}>
            {LEAVE_TEXTS.LEAVE}
          </Button>
          <Button variant="secondary" onClick={onStay}>
            {LEAVE_TEXTS.STAY}
          </Button>
        </>
      }
    >
      <p>{LEAVE_TEXTS.TEXT}</p>
    </Dialog>
  );
}
