import { CheckCircleIcon } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { refreshCourierProfile } from '@/entities/courier';
import { formatOrderNumber } from '@/entities/order';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatTime } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { ORDER_DELIVERED_TEXTS, ORDER_TEXTS } from '../config/texts';

type OrderDeliveredProps = {
  orderId: number;
  closedAt: Date;
  // The profile came and has no order of the courier on this screen any more.
  onBack: () => void;
};

// The order is closed. «К работе» loads the profile, which has no order now, and the page goes back
// to the line, which loads the results of the day anew. In the middle of the page, as the
// state of a block (EmptyState) with the icon of success.
export function OrderDelivered({ orderId, closedAt, onBack }: OrderDeliveredProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // The button of the code screen is gone: the focus goes to the title of the new screen.
  useEffect(() => titleRef.current?.focus(), []);

  async function backToWork(): Promise<void> {
    setIsLeaving(true);

    if (await refreshCourierProfile()) {
      onBack();
    } else {
      // The profile did not come: the courier can press again.
      setIsLeaving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center">
      <section role="status" className="flex flex-col items-center gap-4 px-4 py-12 text-center">
        <CheckCircleIcon
          size={ICON_SIZE.XLARGE}
          weight={ICON_WEIGHT}
          aria-hidden="true"
          className="text-success"
        />
        <div className="flex flex-col items-center gap-1">
          <h1
            ref={titleRef}
            tabIndex={-1}
            className="text-heading-sm font-semibold text-balance focus-visible:outline-none"
          >
            {ORDER_DELIVERED_TEXTS.TITLE}
          </h1>
          <p className="text-small text-fg-secondary tabular-nums">
            {ORDER_DELIVERED_TEXTS.closed(
              ORDER_TEXTS.orderNumber(formatOrderNumber(orderId)),
              formatTime(closedAt),
            )}
          </p>
        </div>
        <Button loading={isLeaving} onClick={() => void backToWork()}>
          {ORDER_DELIVERED_TEXTS.BACK_TO_WORK}
        </Button>
      </section>
    </div>
  );
}
