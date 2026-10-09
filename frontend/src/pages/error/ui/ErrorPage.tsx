import { WarningCircleIcon } from '@phosphor-icons/react';
import { UI_TEXTS } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import { Button, LinkButton } from '@/shared/ui/button';
import { ErrorScreen } from '@/shared/ui/error-screen';
import { ERROR_TEXTS } from '../config/texts';

function reloadPage(): void {
  window.location.reload();
}

// The error element of the router: shown when a page crashes while rendering.
export function ErrorPage() {
  return (
    <ErrorScreen
      icon={WarningCircleIcon}
      title={ERROR_TEXTS.GENERIC_TITLE}
      text={ERROR_TEXTS.GENERIC_HINT}
    >
      <Button onClick={reloadPage}>{ERROR_TEXTS.RELOAD}</Button>
      <LinkButton variant="secondary" to={APP_ROUTES.HOME}>
        {UI_TEXTS.BACK_HOME}
      </LinkButton>
    </ErrorScreen>
  );
}
