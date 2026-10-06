import { ArrowLeftIcon } from '@phosphor-icons/react';
import { useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { MAIN_CONTENT_ID } from '../../../shared/constants/dom';
import { APP_ROUTES } from '../../../shared/constants/routes';
import { ICON_SIZE, ICON_WEIGHT } from '../../../shared/constants/styles';
import { UI_TEXTS } from '../../../shared/constants/texts';
import { LinkButton } from '../../../shared/ui/Button';
import { InlineAlert } from '../../../shared/ui/InlineAlert';
import { Logo } from '../../../shared/ui/Logo';
import { SkipLink } from '../../../shared/ui/SkipLink';
import { TabPanel, Tabs } from '../../../shared/ui/Tabs';
import { ThemeToggle } from '../../../shared/ui/ThemeToggle';
import { LoginForm } from '../components/LoginForm';
import { OAuthButtons } from '../components/OAuthButtons';
import { RegisterForm } from '../components/RegisterForm';
import {
  AUTH_ERROR_HINTS,
  AUTH_ERROR_MESSAGES,
  AUTH_ERROR_QUERY_PARAM,
  AUTH_ID_PREFIX,
  AUTH_TAB,
  AUTH_TAB_QUERY_PARAM,
} from '../constants/page';
import { AUTH_TEXTS } from '../constants/texts';
import type { AuthTabId } from '../types';

const TABS = [
  { id: AUTH_TAB.LOGIN, label: AUTH_TEXTS.TAB_LOGIN },
  { id: AUTH_TAB.REGISTER, label: AUTH_TEXTS.TAB_REGISTER },
];

// The sign-up links of the app lead to /auth?tab=register, any other address opens the login.
function getInitialTab(searchParams: URLSearchParams): AuthTabId {
  return searchParams.get(AUTH_TAB_QUERY_PARAM) === AUTH_TAB.REGISTER
    ? AUTH_TAB.REGISTER
    : AUTH_TAB.LOGIN;
}

// The backend redirects here with ?error=<code> after a failed provider login.
function OAuthErrorAlert() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get(AUTH_ERROR_QUERY_PARAM);
  const title = code === null ? undefined : AUTH_ERROR_MESSAGES[code];
  const hint = code === null ? undefined : AUTH_ERROR_HINTS[code];

  return title === undefined ? null : (
    <InlineAlert variant="error" title={title}>
      {hint}
    </InlineAlert>
  );
}

function OrDivider() {
  return (
    <div role="separator" className="my-2 flex items-center gap-4 text-small text-fg-secondary">
      <span className="h-px flex-1 bg-border" />
      <span>{AUTH_TEXTS.OR}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

type AuthPanelProps = {
  title: string;
  showConsent: boolean;
  children: ReactNode;
};

function AuthPanel({ title, showConsent, children }: AuthPanelProps) {
  return (
    <>
      <h1 className="text-heading-md font-semibold text-balance">{title}</h1>
      <div className="flex flex-col gap-4">
        <OAuthErrorAlert />
        {children}
        <OrDivider />
        <OAuthButtons showConsent={showConsent} />
      </div>
    </>
  );
}

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<AuthTabId>(() => getInitialTab(searchParams));

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
          <Tabs
            tabs={TABS}
            value={tab}
            onChange={setTab}
            label={AUTH_TEXTS.TABS_LABEL}
            idPrefix={AUTH_ID_PREFIX}
          />
          <div className="mt-6">
            <TabPanel idPrefix={AUTH_ID_PREFIX} id={AUTH_TAB.LOGIN} activeId={tab}>
              <AuthPanel title={AUTH_TEXTS.TITLE_LOGIN} showConsent={false}>
                <LoginForm />
              </AuthPanel>
            </TabPanel>
            <TabPanel idPrefix={AUTH_ID_PREFIX} id={AUTH_TAB.REGISTER} activeId={tab}>
              <AuthPanel title={AUTH_TEXTS.TITLE_REGISTER} showConsent>
                <RegisterForm />
              </AuthPanel>
            </TabPanel>
          </div>
        </div>
      </main>
    </div>
  );
}
