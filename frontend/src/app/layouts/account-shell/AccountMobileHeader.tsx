import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { UI_TEXTS } from '@/shared/config';
import { Logo } from '@/shared/ui/logo';

type AccountMobileHeaderProps = {
  homeTo: string;
  // Shown at the end of the bar, for example the status of the courier.
  end?: ReactNode;
};

// The top bar of the phone: the desktop has the sidebar instead.
export function AccountMobileHeader({ homeTo, end }: AccountMobileHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-surface px-4 lg:hidden">
      <Link to={homeTo} aria-label={UI_TEXTS.LOGO_LABEL} className="rounded-sm">
        <Logo />
      </Link>
      {end === undefined ? null : <div className="ms-auto flex items-center">{end}</div>}
    </header>
  );
}
