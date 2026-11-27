import { API_ERROR_MESSAGES } from '@/shared/api';
import { UI_TEXTS } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';

type LoadFailureProps = {
  onRetry: () => void;
};

export function LoadFailure({ onRetry }: LoadFailureProps) {
  return (
    <div className="flex flex-col gap-4">
      <InlineAlert variant="error">{API_ERROR_MESSAGES.GENERIC}</InlineAlert>
      <Button variant="secondary" fullWidth onClick={onRetry}>
        {UI_TEXTS.RETRY}
      </Button>
    </div>
  );
}
