import { ArrowLeftIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { ICON_SIZE, ICON_WEIGHT, MAIN_CONTENT_ID, UI_TEXTS } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import { LinkButton } from '@/shared/ui/button';
import { Logo } from '@/shared/ui/logo';
import { SkipLink } from '@/shared/ui/skip-link';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

type AuthFrameProps = {
  children: ReactNode;
};

export function AuthFrame({ children }: AuthFrameProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <header className="flex items-center justify-between px-2 pt-2 lg:px-12 lg:pt-4">
        <LinkButton
          variant="text"
          to={APP_ROUTES.HOME}
          icon={<ArrowLeftIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
        >
          {UI_TEXTS.BACK_HOME}
        </LinkButton>
        <ThemeToggle />
      </header>
      <main
        id={MAIN_CONTENT_ID}
        className="flex flex-1 flex-col items-center px-4 pt-8 pb-10 lg:px-12 lg:pt-12 lg:pb-16"
      >
        <div className="mb-6">
          <Logo />
        </div>
        <div className="w-full max-w-120 rounded-lg border border-border bg-surface p-4 shadow-md lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
