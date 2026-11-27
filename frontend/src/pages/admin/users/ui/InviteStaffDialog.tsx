import { useId, useState } from 'react';
import type { InvitableRole } from '@/entities/admin-user';
import { DESKTOP_MEDIA_QUERY } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib/dom';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { PASSWORD_LINK_TEXTS as LINK } from '@/features/password-link';
import type { InviteStaffInput, StaffInvite } from '../api/invite-staff';
import { INVITE_STAFF_TEXTS as TEXTS } from '../config/invite-texts';
import { InviteForm } from './InviteForm';
import { InviteResult } from './InviteResult';

type Invited = { invite: StaffInvite; input: InviteStaffInput; at: number };

type InviteStaffDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onDone: (role: InvitableRole) => void;
};

export function InviteStaffDialog({ isOpen, onClose, onDone }: InviteStaffDialogProps) {
  const formId = useId();
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invited, setInvited] = useState<Invited | null>(null);

  if (invited !== null) {
    const done = () => onDone(invited.input.role);

    return (
      <Dialog
        width="wide"
        isOpen={isOpen}
        onClose={done}
        title={invited.invite.emailSent ? TEXTS.SENT_TITLE : TEXTS.CREATED_TITLE}
        actions={<Button onClick={done}>{LINK.DONE}</Button>}
      >
        <InviteResult invite={invited.invite} input={invited.input} now={invited.at} />
      </Dialog>
    );
  }

  return (
    <Dialog
      width="large"
      hasDividers
      isBodyScrolling
      isOpen={isOpen}
      onClose={onClose}
      title={TEXTS.TITLE}
      actions={
        <>
          <Button type="submit" form={formId} loading={isSubmitting}>
            {isSubmitting ? TEXTS.SUBMITTING : TEXTS.SUBMIT}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {TEXTS.CANCEL}
          </Button>
        </>
      }
    >
      <InviteForm
        formId={formId}
        isDesktop={isDesktop}
        onSubmittingChange={setIsSubmitting}
        onInvited={(invite, input) => setInvited({ invite, input, at: Date.now() })}
      />
    </Dialog>
  );
}
