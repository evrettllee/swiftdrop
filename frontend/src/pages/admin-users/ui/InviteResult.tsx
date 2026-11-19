import { InlineAlert } from '@/shared/ui/inline-alert';
import type { InviteStaffInput, StaffInvite } from '../api/invite-staff';
import { INVITE_STAFF_TEXTS as TEXTS, ROLE_AS } from '../config/invite-texts';
import { hoursLeft } from '../model/invite-errors';
import { CopyLinkButton } from './CopyLinkButton';

type InviteResultProps = {
  invite: StaffInvite;
  input: InviteStaffInput;
  now: number;
};

export function InviteResult({ invite, input, now }: InviteResultProps) {
  const name = `${input.firstName} ${input.lastName}`;
  const hours = TEXTS.hours(hoursLeft(invite.expiresAt, now));

  return (
    <>
      <p>
        {invite.emailSent
          ? `${name} добавлен как ${ROLE_AS[input.role]}. Письмо со ссылкой для создания пароля ушло на ${invite.email}, ссылка действует ${hours}.`
          : `${name} добавлен как ${ROLE_AS[input.role]}. Ссылка для создания пароля действует ${hours}.`}
      </p>
      {invite.emailSent ? null : <InlineAlert variant="warning">{TEXTS.NOT_SENT}</InlineAlert>}
      <div className="flex flex-col gap-3 rounded-xl bg-selected p-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-small font-semibold text-fg">{TEXTS.FALLBACK_TITLE}</p>
          <p className="text-small text-fg-secondary">{TEXTS.FALLBACK_TEXT}</p>
        </div>
        <CopyLinkButton link={invite.setPasswordUrl} />
      </div>
    </>
  );
}
