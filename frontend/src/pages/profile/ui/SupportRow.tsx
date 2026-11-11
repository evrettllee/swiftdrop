import { CaretRightIcon, LifebuoyIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import { ROLE, type Role } from '@/shared/session';
import { PROFILE_TEXTS } from '../config/texts';

const SUPPORT_PATHS: Partial<Record<Role, string>> = {
  [ROLE.CLIENT]: APP_ROUTES.SUPPORT,
  [ROLE.COURIER]: APP_ROUTES.COURIER_SUPPORT,
};

export function SupportRow({ role }: { role: Role | undefined }) {
  const to = role === undefined ? undefined : SUPPORT_PATHS[role];

  if (to === undefined) {
    return null;
  }

  return (
    <Link
      to={to}
      className={`flex min-h-14 items-center gap-3 border-y border-border lg:hidden ${COLOR_TRANSITION_CLASS}`}
    >
      <LifebuoyIcon
        size={ICON_SIZE.MEDIUM}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="shrink-0 text-fg-secondary"
      />
      <span className="grow font-semibold">{PROFILE_TEXTS.SUPPORT}</span>
      <CaretRightIcon
        size={ICON_SIZE.MEDIUM}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="shrink-0 text-fg-secondary"
      />
    </Link>
  );
}
