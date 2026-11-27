import { useState } from 'react';
import {
  hoursLeft,
  LinkFallback,
  PASSWORD_LINK_TEXTS as LINK,
  type PasswordLink,
} from '@/features/password-link';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { LINK_KIND, type LinkKind } from '../../config/actions';
import { DIALOG_TEXTS as TEXTS } from '../../config/dialog-texts';
import { ConfirmDialog } from './ConfirmDialog';

type Issued = { link: PasswordLink; at: number };

function doneTitle(kind: LinkKind, emailSent: boolean): string {
  if (emailSent) {
    return TEXTS.SENT_TITLE;
  }

  return kind === LINK_KIND.RESET ? TEXTS.RESET_CREATED_TITLE : TEXTS.INVITE_CREATED_TITLE;
}

function doneText(kind: LinkKind, { link, at }: Issued): string {
  const hours = LINK.hours(hoursLeft(link.expiresAt, at));

  if (kind === LINK_KIND.RESET) {
    return link.emailSent ? TEXTS.resetSent(link.email, hours) : TEXTS.resetCreated(hours);
  }

  return link.emailSent ? TEXTS.resendSent(link.email, hours) : TEXTS.resendCreated(hours);
}

type LinkActionDialogProps = {
  kind: LinkKind;
  email: string;
  isOpen: boolean;
  onClose: () => void;
  onDone: () => void;
  run: () => Promise<PasswordLink>;
};

export function LinkActionDialog({
  kind,
  email,
  isOpen,
  onClose,
  onDone,
  run,
}: LinkActionDialogProps) {
  const [issued, setIssued] = useState<Issued | null>(null);

  if (issued === null) {
    const isReset = kind === LINK_KIND.RESET;

    return (
      <ConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        title={isReset ? TEXTS.RESET_TITLE : TEXTS.RESEND_TITLE}
        text={isReset ? TEXTS.reset(email) : TEXTS.resend(email)}
        confirmLabel={isReset ? TEXTS.RESET_CONFIRM : TEXTS.RESEND_CONFIRM}
        run={run}
        onDone={(link) => setIssued({ link, at: Date.now() })}
      />
    );
  }

  return (
    <Dialog
      width="wide"
      isOpen={isOpen}
      onClose={onDone}
      title={doneTitle(kind, issued.link.emailSent)}
      actions={<Button onClick={onDone}>{LINK.DONE}</Button>}
    >
      <p>{doneText(kind, issued)}</p>
      <LinkFallback link={issued.link.setPasswordUrl} emailSent={issued.link.emailSent} />
    </Dialog>
  );
}
