import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { HISTORY_TEXTS } from '../config/texts';

type HistoryLoadErrorProps = {
  onRetry: () => void;
};

// The history did not come: the alert and a new try, as on the screen of the order.
export function HistoryLoadError({ onRetry }: HistoryLoadErrorProps) {
  return (
    <div className="flex flex-col items-start gap-4">
      <InlineAlert variant="error">{HISTORY_TEXTS.LOAD_ERROR}</InlineAlert>
      <Button variant="secondary" onClick={onRetry}>
        {HISTORY_TEXTS.RETRY}
      </Button>
    </div>
  );
}
