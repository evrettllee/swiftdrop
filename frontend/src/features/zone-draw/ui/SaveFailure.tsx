import { ZONE_FAILURE, type ZoneFailure } from '@/entities/zone';
import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { SAVE_TEXTS } from '../config/texts';

type SaveFailureProps = {
  failure: ZoneFailure | null;
  onRetry: () => void;
  onRefresh?: () => void;
};

export function SaveFailure({ failure, onRetry, onRefresh }: SaveFailureProps) {
  if (
    failure === null ||
    failure.kind === ZONE_FAILURE.FIELD ||
    failure.kind === ZONE_FAILURE.POLYGON
  ) {
    return null;
  }

  if (failure.kind === ZONE_FAILURE.ALERT) {
    return <InlineAlert variant="error" title={failure.title} />;
  }

  const isChanged = failure.kind === ZONE_FAILURE.CHANGED;
  const text = failure.kind === ZONE_FAILURE.RETRY ? failure.text : undefined;

  return (
    <div className="flex flex-col items-start gap-2">
      <InlineAlert variant={isChanged ? 'warning' : 'error'} title={failure.title}>
        {text}
      </InlineAlert>
      <Button
        variant="secondary"
        onClick={isChanged && onRefresh !== undefined ? onRefresh : onRetry}
      >
        {isChanged ? SAVE_TEXTS.REFRESH : SAVE_TEXTS.RETRY}
      </Button>
    </div>
  );
}
