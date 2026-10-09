import { Link } from 'react-router';
import { UI_TEXTS } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import { Logo } from '@/shared/ui/logo';

// The top bar of the phone: the desktop has the sidebar instead.
export function ClientMobileHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-surface px-4 lg:hidden">
      <Link to={APP_ROUTES.HOME} aria-label={UI_TEXTS.LOGO_LABEL} className="rounded-sm">
        <Logo />
      </Link>
    </header>
  );
}
