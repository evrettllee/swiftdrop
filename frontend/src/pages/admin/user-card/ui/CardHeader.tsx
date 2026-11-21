import { ADMIN_USER_STATUS, RoleTag, UserStatus } from '@/entities/admin-user';
import { getInitials } from '@/shared/lib/format';
import { getAdminUsersPath } from '@/shared/routes';
import { Avatar } from '@/shared/ui/avatar';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { PageTitle } from '@/shared/ui/page-title';
import type { AdminUserCard } from '../api/admin-user-card';
import { ROLE_TABS } from '../config/role-tabs';
import { USER_CARD_TEXTS as TEXTS } from '../config/texts';
import { listPathOf } from '../lib/card-view';

type CardHeaderProps = {
  card: AdminUserCard;
  listSearch: string;
};

export function CardHeader({ card, listSearch }: CardHeaderProps) {
  const name = `${card.firstName} ${card.lastName}`.trim();
  const isDeleted = card.status === ADMIN_USER_STATUS.DELETED;

  return (
    <header className="flex flex-col gap-4 lg:gap-6">
      <Breadcrumbs
        label={TEXTS.BREADCRUMBS_LABEL}
        root={{ label: TEXTS.USERS, to: getAdminUsersPath() }}
        parent={{ label: ROLE_TABS[card.role], to: listPathOf(card.role, listSearch) }}
        current={name}
      />
      <div className="flex min-w-0 items-center gap-4">
        <Avatar
          size="large"
          tone={isDeleted ? 'muted' : 'primary'}
          initials={isDeleted ? TEXTS.DELETED_AVATAR : getInitials(card.firstName, card.lastName)}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <PageTitle className="break-words">{name}</PageTitle>
          <div className="flex flex-wrap items-center gap-3 text-small">
            <RoleTag role={card.role} />
            <UserStatus status={card.status} />
          </div>
        </div>
      </div>
    </header>
  );
}
