import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { CLOSE_WARNINGS, DIALOG_TEXTS } from '../config/dialog-texts';
import type { TicketModel } from '../model/useTicket';

export function CloseTicketDialog({ model }: { model: TicketModel }) {
  const { close, ticket } = model;

  return (
    <Dialog
      isOpen={close.isAsking && ticket !== null}
      onClose={close.cancel}
      title={DIALOG_TEXTS.CLOSE_TITLE}
      actions={
        <>
          <Button variant="primary" loading={close.isClosing} onClick={close.confirm}>
            {DIALOG_TEXTS.CLOSE_CONFIRM}
          </Button>
          <Button variant="secondary" onClick={close.cancel}>
            {DIALOG_TEXTS.CLOSE_KEEP}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <p>{ticket === null ? '' : CLOSE_WARNINGS[ticket.author.role]}</p>
        {close.isFailed ? (
          <p role="alert" className="text-small text-danger">
            {DIALOG_TEXTS.CLOSE_FAILED}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
