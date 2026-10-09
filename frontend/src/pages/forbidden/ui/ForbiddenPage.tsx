import { LockIcon } from '@phosphor-icons/react';
import { UI_TEXTS } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import { LinkButton } from '@/shared/ui/button';
import { ErrorScreen } from '@/shared/ui/error-screen';
import { FORBIDDEN_TEXTS } from '../config/texts';

export function ForbiddenPage() {
  return (
    <ErrorScreen
      icon={LockIcon}
      title={FORBIDDEN_TEXTS.FORBIDDEN_TITLE}
      text={FORBIDDEN_TEXTS.FORBIDDEN_HINT}
    >
      <LinkButton to={APP_ROUTES.HOME}>{UI_TEXTS.BACK_HOME}</LinkButton>
    </ErrorScreen>
  );
}
