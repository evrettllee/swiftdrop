import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { DISCARD_TEXTS } from '../config/texts';

type DiscardDialogProps = {
  isOpen: boolean;
  onDiscard: () => void;
  onKeep: () => void;
};

export function DiscardDialog({ isOpen, onDiscard, onKeep }: DiscardDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onKeep}
      title={DISCARD_TEXTS.TITLE}
      actions={
        <>
          <Button variant="danger" onClick={onDiscard}>
            {DISCARD_TEXTS.CONFIRM}
          </Button>
          <Button variant="secondary" onClick={onKeep}>
            {DISCARD_TEXTS.KEEP}
          </Button>
        </>
      }
    >
      <p>{DISCARD_TEXTS.TEXT}</p>
    </Dialog>
  );
}
