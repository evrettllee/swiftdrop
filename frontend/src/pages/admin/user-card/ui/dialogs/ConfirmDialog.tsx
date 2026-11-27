import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { DIALOG_TEXTS } from '../../config/dialog-texts';
import { useActionSubmit } from '../../model/useActionSubmit';
import { ActionAlert } from './ActionAlert';

type ConfirmDialogProps<T> = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text: string;
  confirmLabel: string;
  isDanger?: boolean;
  run: () => Promise<T>;
  onDone: (result: T) => void;
};

export function ConfirmDialog<T>({
  isOpen,
  onClose,
  title,
  text,
  confirmLabel,
  isDanger = false,
  run,
  onDone,
}: ConfirmDialogProps<T>) {
  const { isSubmitting, error, submit } = useActionSubmit(run, onDone);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            loading={isSubmitting}
            disabled={error?.isConflict === true}
            onClick={() => void submit()}
          >
            {confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {DIALOG_TEXTS.CANCEL}
          </Button>
        </>
      }
    >
      <p>{text}</p>
      <ActionAlert error={error} />
    </Dialog>
  );
}
