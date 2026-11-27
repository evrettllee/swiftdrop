import { type ReactNode, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AUTH_TAB, AUTH_TAB_QUERY_PARAM } from '@/shared/routes';
import { AuthFrame } from '@/shared/ui/auth-frame';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { TabPanel, Tabs } from '@/shared/ui/tabs';
import {
  AUTH_ERROR_HINTS,
  AUTH_ERROR_MESSAGES,
  AUTH_ERROR_QUERY_PARAM,
  AUTH_ID_PREFIX,
} from '../config/auth-page';
import { AUTH_TEXTS } from '../config/texts';
import type { AuthTabId } from '../model/auth-tab';
import { LoginForm } from './LoginForm';
import { OAuthButtons } from './OAuthButtons';
import { RegisterForm } from './RegisterForm';

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
    <AuthFrame>
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
    </AuthFrame>
  );
}
