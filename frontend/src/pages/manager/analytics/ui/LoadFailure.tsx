import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { MANAGER_ANALYTICS_TEXTS as TEXTS } from '../config/texts';

type LoadFailureProps = {
  message: string;
  onRetry: () => void;
};

export function LoadFailure({ message, onRetry }: LoadFailureProps) {
  return (
    <div className="flex flex-col items-start gap-3">
      <InlineAlert variant="error" title={message} />
      <Button variant="secondary" onClick={onRetry}>
        {TEXTS.RETRY}
      </Button>
    </div>
  );
}
