import { hoursLeft, LinkFallback, PASSWORD_LINK_TEXTS as LINK } from '@/features/password-link';
import type { InviteStaffInput, StaffInvite } from '../api/invite-staff';
import { ROLE_AS } from '../config/invite-texts';

type InviteResultProps = {
  invite: StaffInvite;
  input: InviteStaffInput;
  now: number;
};

export function InviteResult({ invite, input, now }: InviteResultProps) {
  const name = `${input.firstName} ${input.lastName}`;
  const hours = LINK.hours(hoursLeft(invite.expiresAt, now));

  return (
    <>
      <p>
        {invite.emailSent
          ? `${name} добавлен как ${ROLE_AS[input.role]}. Письмо со ссылкой для создания пароля ушло на ${invite.email}, ссылка действует ${hours}.`
          : `${name} добавлен как ${ROLE_AS[input.role]}. Ссылка для создания пароля действует ${hours}.`}
      </p>
      <LinkFallback link={invite.setPasswordUrl} emailSent={invite.emailSent} />
    </>
  );
}
