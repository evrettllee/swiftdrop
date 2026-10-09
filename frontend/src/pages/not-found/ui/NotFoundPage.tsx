import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { UI_TEXTS } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import { LinkButton } from '@/shared/ui/button';
import { ErrorScreen } from '@/shared/ui/error-screen';
import { NOT_FOUND_TEXTS } from '../config/texts';

export function NotFoundPage() {
  return (
    <ErrorScreen
      icon={MagnifyingGlassIcon}
      title={NOT_FOUND_TEXTS.NOT_FOUND_TITLE}
      text={NOT_FOUND_TEXTS.NOT_FOUND_HINT}
    >
      <LinkButton to={APP_ROUTES.HOME}>{UI_TEXTS.BACK_HOME}</LinkButton>
    </ErrorScreen>
  );
}
