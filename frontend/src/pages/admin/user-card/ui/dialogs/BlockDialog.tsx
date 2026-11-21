import { type FormEvent, useId, useState } from 'react';
import { ApiError, HTTP_STATUS } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { TextArea } from '@/shared/ui/textarea';
import type { AdminUserCard } from '../../api/admin-user-card';
import { BLOCK_REASON_MAX_LENGTH, DIALOG_TEXTS as TEXTS } from '../../config/dialog-texts';
import { ActionAlert } from './ActionAlert';
import { useActionSubmit } from '../../model/useActionSubmit';

type BlockDialogProps = {
  name: string;
  isOpen: boolean;
  onClose: () => void;
  run: (reason: string) => Promise<AdminUserCard>;
  onDone: (card: AdminUserCard) => void;
};

export function BlockDialog({ name, isOpen, onClose, run, onDone }: BlockDialogProps) {
  const formId = useId();
  const [reason, setReason] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const action = useActionSubmit(async () => {
    try {
      return await run(reason.trim());
    } catch (error) {
      if (error instanceof ApiError && error.status === HTTP_STATUS.BAD_REQUEST) {
        setFieldError(error.message);
      }

      throw error;
    }
  }, onDone);
  const serverError = fieldError === null ? action.error : null;

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (reason.trim() === '') {
      setFieldError(TEXTS.REASON_REQUIRED);

      return;
    }

    setFieldError(null);
    void action.submit();
  }

  return (
    <Dialog
      width="large"
      isOpen={isOpen}
      onClose={onClose}
      title={TEXTS.BLOCK_TITLE}
      actions={
        <>
          <Button
            type="submit"
            form={formId}
            variant="danger"
            loading={action.isSubmitting}
            disabled={serverError?.isConflict === true}
          >
            {TEXTS.BLOCK_CONFIRM}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {TEXTS.CANCEL}
          </Button>
        </>
      }
    >
      <p>{TEXTS.block(name)}</p>
      <form id={formId} noValidate onSubmit={submit} className="flex flex-col gap-4">
        <TextArea
          label={TEXTS.REASON}
          value={reason}
          maxLength={BLOCK_REASON_MAX_LENGTH}
          placeholder={TEXTS.REASON_PLACEHOLDER}
          hint={TEXTS.REASON_HINT}
          error={fieldError ?? undefined}
          counterLabel={TEXTS.reasonCounter}
          onChange={(event) => {
            setReason(event.target.value);
            setFieldError(null);
          }}
        />
      </form>
      <ActionAlert error={serverError} />
    </Dialog>
  );
}
