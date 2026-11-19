import { Link } from 'react-router';
import { COLOR_TRANSITION_CLASS, UI_TEXTS } from '@/shared/config';
import { getInitials } from '@/shared/lib/format';
import { type AuthUser, useAuthStore } from '@/shared/session';
import { Avatar } from '@/shared/ui/avatar';
import { Logo } from '@/shared/ui/logo';
import { NAV_VARIANT, type NavItem } from './nav-item';
import { NavItemLink } from './NavItemLink';

type AccountSidebarProps = {
  homeTo: string;
  navLabel: string;
  items: readonly NavItem[];
  userCaption?: string;
  profileTo?: string;
};

function SidebarUser({
  user,
  caption,
  to,
}: {
  user: AuthUser;
  caption: string | undefined;
  to: string | undefined;
}) {
  const content = (
    <>
      <Avatar initials={getInitials(user.firstName, user.lastName)} />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-small font-semibold">
          {user.firstName} {user.lastName}
        </span>
        {caption === undefined ? null : (
          <span className="truncate text-small text-fg-secondary">{caption}</span>
        )}
      </div>
    </>
  );

  if (to === undefined) {
    return <div className="mt-auto flex items-center gap-3 px-3">{content}</div>;
  }

  return (
    <Link
      to={to}
      className={`mt-auto flex items-center gap-3 rounded-md px-3 hover:bg-surface-muted ${COLOR_TRANSITION_CLASS}`}
    >
      {content}
    </Link>
  );
}

// The menu of the desktop: on a phone the bottom navigation takes its place.
export function AccountSidebar({
  homeTo,
  navLabel,
  items,
  userCaption,
  profileTo,
}: AccountSidebarProps) {
  const user = useAuthStore((state) => state.user);

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-8 bg-surface px-4 py-6 shadow-lg lg:flex dark:border-e dark:border-border dark:shadow-none">
      <Link
        to={homeTo}
        aria-label={UI_TEXTS.LOGO_LABEL}
        className="flex h-11 items-center self-start rounded-sm px-3"
      >
        <Logo />
      </Link>
      <nav aria-label={navLabel} className="flex flex-col gap-1">
        {items.map((item) => (
          <NavItemLink key={item.to} {...item} variant={NAV_VARIANT.SIDEBAR} />
        ))}
      </nav>
      {user === null ? null : <SidebarUser user={user} caption={userCaption} to={profileTo} />}
    </aside>
  );
}
