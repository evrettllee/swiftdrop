import { Link, matchPath, useLocation } from 'react-router';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import type { NavItem, NavVariant } from './nav-item';

const VARIANT_CLASSES: Record<NavVariant, string> = {
  sidebar: 'h-11 flex-row justify-start gap-3 rounded-md px-3 text-body',
  bottom: 'h-16 flex-col justify-center text-caption',
};

const ACTIVE_CLASS = 'bg-selected text-accent';

const IDLE_CLASSES: Record<NavVariant, string> = {
  sidebar: 'text-fg hover:bg-surface-muted',
  bottom: 'text-fg-secondary',
};

type NavItemLinkProps = NavItem & {
  variant: NavVariant;
};

export function NavItemLink({
  to,
  label,
  icon: ItemIcon,
  isExact,
  alsoActiveOn = [],
  variant,
}: NavItemLinkProps) {
  const { pathname } = useLocation();
  // One answer for the highlight and for assistive technology: the item stands for its own page
  // and for the pages that belong to it.
  const isCurrent =
    matchPath({ path: to, end: isExact }, pathname) !== null ||
    alsoActiveOn.some((path) => matchPath(path, pathname) !== null);

  return (
    <Link
      to={to}
      aria-current={isCurrent ? 'page' : undefined}
      className={`flex items-center ${COLOR_TRANSITION_CLASS} ${VARIANT_CLASSES[variant]} ${isCurrent ? ACTIVE_CLASS : IDLE_CLASSES[variant]}`}
    >
      <ItemIcon size={ICON_SIZE.LARGE} weight={ICON_WEIGHT} aria-hidden="true" />
      {label}
    </Link>
  );
}
