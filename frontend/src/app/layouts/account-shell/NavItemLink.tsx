import { Link, matchPath, useLocation } from 'react-router';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { COUNT_BADGE_PLACEMENT, CountBadge } from '@/shared/ui/badge';
import { getNavItemClass, NAV_VARIANT, type NavItem, type NavVariant } from './nav-item';

type NavItemLinkProps = NavItem & {
  variant: NavVariant;
  onClick?: () => void;
};

export function NavItemLink({
  to,
  label,
  icon: ItemIcon,
  isExact,
  alsoActiveOn = [],
  badge,
  variant,
  onClick,
}: NavItemLinkProps) {
  const { pathname } = useLocation();
  // One answer for the highlight and for assistive technology: the item stands for its own page
  // and for the pages that belong to it.
  const isCurrent =
    matchPath({ path: to, end: isExact }, pathname) !== null ||
    alsoActiveOn.some((path) => matchPath(path, pathname) !== null);
  const hasBadge = badge !== undefined && badge.count > 0;
  const isSidebar = variant === NAV_VARIANT.SIDEBAR;

  return (
    <Link
      to={to}
      aria-current={isCurrent ? 'page' : undefined}
      aria-label={hasBadge ? `${label}, ${badge.label}` : undefined}
      onClick={onClick}
      className={getNavItemClass(variant, isCurrent)}
    >
      <span className="relative flex shrink-0">
        <ItemIcon size={ICON_SIZE.LARGE} weight={ICON_WEIGHT} aria-hidden="true" />
        {hasBadge && !isSidebar ? (
          <CountBadge count={badge.count} placement={COUNT_BADGE_PLACEMENT.ICON} />
        ) : null}
      </span>
      {label}
      {hasBadge && isSidebar ? (
        <CountBadge count={badge.count} placement={COUNT_BADGE_PLACEMENT.INLINE} />
      ) : null}
    </Link>
  );
}
