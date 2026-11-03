import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { ERROR_TEXTS } from '../config/texts';
import { type ActionFailure, FAILURE_KIND } from '../lib/action-failure';

type FailureAlertProps = {
  failure: ActionFailure | null;
  isFieldShown: boolean;
  onRetry: () => void;
  onRefresh: () => void;
};

export function FailureAlert({ failure, isFieldShown, onRetry, onRefresh }: FailureAlertProps) {
  if (failure === null || (failure.kind === FAILURE_KIND.FIELD && isFieldShown)) {
    return null;
  }

  let action = null;

  if (failure.kind === FAILURE_KIND.STALE) {
    action = { label: ERROR_TEXTS.REFRESH, onClick: onRefresh };
  } else if (failure.kind === FAILURE_KIND.RETRY) {
    action = { label: ERROR_TEXTS.RETRY, onClick: onRetry };
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <InlineAlert variant="error" title={failure.title}>
        {failure.text ?? undefined}
      </InlineAlert>
      {action === null ? null : (
        <Button variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
