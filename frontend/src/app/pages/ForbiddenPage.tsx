import { LockIcon } from '@phosphor-icons/react';
import { APP_ROUTES, UI_TEXTS } from '../../shared/constants';
import { LinkButton } from '../../shared/ui/Button';
import { ErrorScreen } from '../components/ErrorScreen';
import { ERROR_TEXTS } from '../constants';

export function ForbiddenPage() {
  return (
    <ErrorScreen
      icon={LockIcon}
      title={ERROR_TEXTS.FORBIDDEN_TITLE}
      text={ERROR_TEXTS.FORBIDDEN_HINT}
    >
      <LinkButton to={APP_ROUTES.HOME}>{UI_TEXTS.BACK_HOME}</LinkButton>
    </ErrorScreen>
  );
}
