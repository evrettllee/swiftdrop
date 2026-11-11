import { WarningCircleIcon } from '@phosphor-icons/react';
import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { MANAGER_MAP_TEXTS as TEXTS } from '../config/texts';

export function MapLoadFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <InlineAlert variant="error" icon={WarningCircleIcon} title={TEXTS.LOAD_FAILED_TITLE}>
        {TEXTS.LOAD_FAILED}
      </InlineAlert>
      <Button variant="secondary" onClick={onRetry}>
        {TEXTS.RETRY}
      </Button>
    </div>
  );
}
