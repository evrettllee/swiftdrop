import type { Icon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { MAIN_CONTENT_ID } from '../../shared/constants/dom';
import { APP_ROUTES } from '../../shared/constants/routes';
import { ICON_SIZE, ICON_WEIGHT } from '../../shared/constants/styles';
import { UI_TEXTS } from '../../shared/constants/texts';
import { Logo } from '../../shared/ui/Logo';
import { SkipLink } from '../../shared/ui/SkipLink';
import { ThemeToggle } from '../../shared/ui/ThemeToggle';

type ErrorScreenProps = {
  icon: Icon;
  title: string;
  text: string;
  // The buttons under the text.
  children: ReactNode;
};

// One layout for all error pages, so they look like the empty state of any other screen.
export function ErrorScreen({ icon: StateIcon, title, text, children }: ErrorScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <header className="flex items-center justify-between px-4 pt-2 lg:px-12 lg:pt-4">
        <Link to={APP_ROUTES.HOME} aria-label={UI_TEXTS.LOGO_LABEL} className="rounded-sm">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main
        id={MAIN_CONTENT_ID}
        className="flex flex-1 items-center justify-center px-4 py-8 lg:p-12"
      >
        <div className="flex w-full max-w-120 flex-col items-center text-center">
          <StateIcon
            size={ICON_SIZE.XLARGE}
            weight={ICON_WEIGHT}
            aria-hidden="true"
            className="text-fg-muted"
          />
          <h1 className="mt-4 text-heading-md font-semibold text-balance">{title}</h1>
          <p className="mt-1 max-w-90 text-pretty text-fg-secondary">{text}</p>
          <div className="mt-6 flex w-full flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-center lg:[&>*]:min-w-40">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
