import { PageTitle } from '@/shared/ui/page-title';
import { ADMIN_USERS_TEXTS } from '../config/texts';

export function AdminUsersPage() {
  return (
    <header>
      <PageTitle>{ADMIN_USERS_TEXTS.TITLE}</PageTitle>
    </header>
  );
}
