import { Link } from 'react-router';
import { UI_TEXTS } from '@/shared/config';
import { getInitials } from '@/shared/lib/format';
import { APP_ROUTES } from '@/shared/routes';
import { useAuthStore } from '@/shared/session';
import { Avatar } from '@/shared/ui/avatar';
import { Logo } from '@/shared/ui/logo';
import { CLIENT_LAYOUT_TEXTS, CLIENT_NAV_ITEMS, NAV_VARIANT } from './navigation';
import { NavItemLink } from './NavItemLink';

// The menu of the desktop: on a phone the bottom navigation takes its place.
export function ClientSidebar() {
  const user = useAuthStore((state) => state.user);

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-8 bg-surface px-4 py-6 shadow-lg lg:flex dark:border-e dark:border-border dark:shadow-none">
      <Link
        to={APP_ROUTES.HOME}
        aria-label={UI_TEXTS.LOGO_LABEL}
        className="flex h-11 items-center self-start rounded-sm px-3"
      >
        <Logo />
      </Link>
      <nav aria-label={CLIENT_LAYOUT_TEXTS.NAV_LABEL} className="flex flex-col gap-1">
        {CLIENT_NAV_ITEMS.map((item) => (
          <NavItemLink key={item.to} {...item} variant={NAV_VARIANT.SIDEBAR} />
        ))}
      </nav>
      {user === null ? null : (
        <div className="mt-auto flex items-center gap-3 px-3">
          <Avatar initials={getInitials(user.firstName, user.lastName)} />
          <span className="min-w-0 truncate text-small font-semibold">
            {user.firstName} {user.lastName}
          </span>
        </div>
      )}
    </aside>
  );
}
