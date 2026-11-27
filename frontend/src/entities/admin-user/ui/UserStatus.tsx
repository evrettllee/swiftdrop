import type { AdminUserStatus } from '../config/admin-user';
import { STATUS_TONE, type StatusTone, statusView } from '../lib/labels';

const DOT_CLASSES: Record<StatusTone, string> = {
  [STATUS_TONE.OK]: 'bg-success',
  [STATUS_TONE.ERROR]: 'bg-danger',
  [STATUS_TONE.MUTED]: 'bg-fg-muted',
};

export function UserStatus({ status }: { status: AdminUserStatus }) {
  const { label, tone } = statusView(status);

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${DOT_CLASSES[tone]}`} />
      {label}
    </span>
  );
}
