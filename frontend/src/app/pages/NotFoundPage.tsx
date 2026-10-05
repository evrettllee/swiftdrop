import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { APP_ROUTES } from '../../shared/constants';
import { LinkButton } from '../../shared/ui/Button';
import { ErrorScreen } from '../components/ErrorScreen';
import { APP_TEXTS } from '../constants';

export function NotFoundPage() {
  return (
    <ErrorScreen
      icon={MagnifyingGlassIcon}
      title={APP_TEXTS.NOT_FOUND_TITLE}
      text={APP_TEXTS.NOT_FOUND_HINT}
    >
      <LinkButton to={APP_ROUTES.HOME}>{APP_TEXTS.BACK_HOME}</LinkButton>
    </ErrorScreen>
  );
}
