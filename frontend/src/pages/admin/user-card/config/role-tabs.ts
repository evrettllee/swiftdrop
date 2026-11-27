import type { ManagedRole } from '@/entities/admin-user';

export const ROLE_TABS: Record<ManagedRole, string> = {
  client: 'Клиенты',
  courier: 'Курьеры',
  manager: 'Менеджеры',
};
