import { UserPlusIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { DESKTOP_MEDIA_QUERY, ICON_SIZE, ICON_WEIGHT, LIST_STATUS } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib/dom';
import { Button } from '@/shared/ui/button';
import { placePrimaryAction, usePrimaryActionPlace } from '@/shared/ui/empty-state';
import { PageTitle } from '@/shared/ui/page-title';
import { Tabs } from '@/shared/ui/tabs';
import { MANAGED_ROLE, MANAGED_ROLES, type ManagedRole } from '../config/admin-user';
import { ADMIN_USERS_TEXTS as TEXTS } from '../config/texts';
import { useAdminUsers } from '../model/useAdminUsers';
import { tabPatch } from '../model/users-view';
import { InviteStaffDialog } from './InviteStaffDialog';
import { UsersContent } from './UsersContent';
import { UsersToolbar } from './UsersToolbar';

const TAB_LABELS: Record<ManagedRole, string> = {
  client: TEXTS.TAB_CLIENTS,
  courier: TEXTS.TAB_COURIERS,
  manager: TEXTS.TAB_MANAGERS,
};

const ADD_ICON = <UserPlusIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />;

export function AdminUsersPage() {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const users = useAdminUsers();
  const { values, list, counts, change } = users;
  const [inviteKey, setInviteKey] = useState<number | null>(null);
  const isTabEmpty =
    list.items.length === 0 && !users.isFiltered && list.status === LIST_STATUS.READY;
  const place = usePrimaryActionPlace({
    isLoading: users.isLoading,
    isEmpty: isTabEmpty,
    hasEmptyAction: values.role !== MANAGED_ROLE.CLIENT,
  });
  const openInvite = () => setInviteKey(Date.now());
  const header = placePrimaryAction(
    <Button icon={ADD_ICON} onClick={openInvite}>
      {isDesktop ? TEXTS.ADD_STAFF : TEXTS.ADD_STAFF_SHORT}
    </Button>,
    place,
  ).header;
  const empty = placePrimaryAction(
    <Button icon={ADD_ICON} onClick={openInvite}>
      {TEXTS.ADD_STAFF}
    </Button>,
    place,
  ).empty;

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <header className="flex min-h-11 items-center justify-between gap-4">
        <PageTitle>{TEXTS.TITLE}</PageTitle>
        {header}
      </header>
      <Tabs
        tabs={MANAGED_ROLES.map((role) => ({
          id: role,
          label: TAB_LABELS[role],
          count: counts?.[role] ?? null,
        }))}
        value={values.role}
        onChange={(role) => change(tabPatch(role))}
        label={TEXTS.TABS_LABEL}
        idPrefix="admin-users"
        layout="fit"
      />
      {isTabEmpty ? null : (
        <UsersToolbar
          values={values}
          isDesktop={isDesktop}
          searchText={users.params.searchText}
          filters={users.filters}
          onSearchChange={users.params.setSearchText}
          onChange={change}
        />
      )}
      <UsersContent users={users} isDesktop={isDesktop} emptyAction={empty} />
      {inviteKey === null ? null : (
        <InviteStaffDialog
          key={inviteKey}
          isOpen
          onClose={() => setInviteKey(null)}
          onDone={(role) => {
            setInviteKey(null);
            users.showRole(role);
          }}
        />
      )}
    </div>
  );
}
