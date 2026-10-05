import { LockIcon } from '@phosphor-icons/react';
import { APP_ROUTES } from '../../shared/constants';
import { LinkButton } from '../../shared/ui/Button';
import { ErrorScreen } from '../components/ErrorScreen';
import { APP_TEXTS, ERROR_TEXTS } from '../constants';

export function ForbiddenPage() {
  return (
    <ErrorScreen
      icon={LockIcon}
      title={ERROR_TEXTS.FORBIDDEN_TITLE}
      text={ERROR_TEXTS.FORBIDDEN_HINT}
    >
      <LinkButton to={APP_ROUTES.HOME}>{APP_TEXTS.BACK_HOME}</LinkButton>
    </ErrorScreen>
  );
}
