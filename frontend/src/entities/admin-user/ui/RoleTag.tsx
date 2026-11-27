import { type ManagedRole, ROLE_LABELS } from '../config/admin-user';

export function RoleTag({ role }: { role: ManagedRole }) {
  return (
    <span className="inline-flex h-6 items-center rounded-sm border border-border bg-surface px-2 text-caption whitespace-nowrap text-fg-secondary">
      {ROLE_LABELS[role]}
    </span>
  );
}
