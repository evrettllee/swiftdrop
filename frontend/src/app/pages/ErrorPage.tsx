import { WarningCircleIcon } from '@phosphor-icons/react';
import { APP_ROUTES, UI_TEXTS } from '../../shared/constants';
import { Button, LinkButton } from '../../shared/ui/Button';
import { ErrorScreen } from '../components/ErrorScreen';
import { ERROR_TEXTS } from '../constants';

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
