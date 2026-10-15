import { PackageIcon } from '@phosphor-icons/react';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { LINE_TEXTS } from '../config/texts';

// The courier is delivering an order: the line cannot change until the order screen comes.
export function ActiveOrderNotice() {
  return (
    <InlineAlert variant="info" icon={PackageIcon} title={LINE_TEXTS.ACTIVE_ORDER_TITLE}>
      {LINE_TEXTS.ACTIVE_ORDER_HINT}
    </InlineAlert>
  );
}
