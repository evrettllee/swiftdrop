import { ADMIN_USER_STATUS } from '@/entities/admin-user';
import { formatPhone, formatShortDate } from '@/shared/lib/format';
import { Panel } from '@/shared/ui/panel';
import type { AdminUserCard } from '../api/admin-user-card';
import { USER_CARD_TEXTS as TEXTS } from '../config/texts';
import { lastLoginText, loginMethods } from '../lib/card-view';
import { Fact, Facts } from './Facts';

function phoneText(phone: string | null, isDeleted: boolean): string {
  if (isDeleted) {
    return TEXTS.DELETED_VALUE;
  }

  return phone === null ? TEXTS.NO_PHONE : formatPhone(phone);
}

type ContactsPanelProps = {
  card: AdminUserCard;
  now: Date;
};

export function ContactsPanel({ card, now }: ContactsPanelProps) {
  const isDeleted = card.status === ADMIN_USER_STATUS.DELETED;

  return (
    <Panel title={TEXTS.CONTACTS}>
      <Facts>
        <Fact label={TEXTS.EMAIL} isMuted={isDeleted} className="truncate">
          {isDeleted ? TEXTS.DELETED_VALUE : card.email}
        </Fact>
        <Fact
          label={TEXTS.PHONE}
          isMuted={isDeleted || card.phone === null}
          className="whitespace-nowrap tabular-nums"
        >
          {phoneText(card.phone, isDeleted)}
        </Fact>
        <Fact label={TEXTS.LOGIN}>{loginMethods(card)}</Fact>
        <Fact label={TEXTS.CREATED} className="tabular-nums">
          {formatShortDate(card.createdAt)}
        </Fact>
        <Fact label={TEXTS.LAST_LOGIN} className="tabular-nums">
          {lastLoginText(card.lastLoginAt, now)}
        </Fact>
      </Facts>
    </Panel>
  );
}
