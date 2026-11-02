import { InfoIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';

type NewOrdersNoticeProps = {
  count: number;
  onShow: () => void;
};

export function NewOrdersNotice({ count, onShow }: NewOrdersNoticeProps) {
  return (
    <div role="status" aria-live="polite" className="empty:hidden">
      {count > 0 ? (
        <div className="flex items-center gap-2 text-small">
          <InfoIcon
            size={ICON_SIZE.MEDIUM}
            weight={ICON_WEIGHT}
            aria-hidden="true"
            className="shrink-0 text-accent"
          />
          <span>{MANAGER_ORDERS_TEXTS.newOrders(count)}</span>
          <div className="[&>button]:min-h-9 [&>button]:px-2 [&>button]:text-small">
            <Button variant="text" onClick={onShow}>
              {MANAGER_ORDERS_TEXTS.SHOW_NEW}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
