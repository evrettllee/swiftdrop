import { CheckCircleIcon, type Icon, WarningCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import { type OrderTracking, useTrackingState } from '@/entities/order';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { useMinuteNow } from '@/shared/lib/clock';
import type { ManagerOrderDetails } from '@/shared/staff-api';
import { getStatusLine, STATUS_LINE_TONE, type StatusLineTone } from '../lib/status-line';

const TONE_ICONS: Record<StatusLineTone, { icon: Icon; className: string } | null> = {
  [STATUS_LINE_TONE.NONE]: null,
  [STATUS_LINE_TONE.WARNING]: { icon: WarningCircleIcon, className: 'text-warning' },
  [STATUS_LINE_TONE.SUCCESS]: { icon: CheckCircleIcon, className: 'text-success' },
  [STATUS_LINE_TONE.DANGER]: { icon: XCircleIcon, className: 'text-danger' },
};

type OrderStatusLineProps = {
  order: ManagerOrderDetails;
  tracking: OrderTracking;
  className?: string;
};

export function OrderStatusLine({ order, tracking, className = '' }: OrderStatusLineProps) {
  const { pickupEtaAt } = useTrackingState(tracking);
  const nowMs = useMinuteNow();
  const line = getStatusLine({ order, pickupEtaAt, nowMs });
  const tone = TONE_ICONS[line.tone];

  return (
    <section aria-live="polite" className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-start gap-2">
        {tone === null ? null : (
          <tone.icon
            size={ICON_SIZE.MEDIUM}
            weight={ICON_WEIGHT}
            aria-hidden="true"
            className={`mt-0.5 shrink-0 ${tone.className}`}
          />
        )}
        <h2 className="text-heading-sm font-semibold text-balance tabular-nums">{line.title}</h2>
      </div>
      {line.text === null ? null : (
        <p className="text-small text-pretty text-fg-secondary tabular-nums">{line.text}</p>
      )}
    </section>
  );
}
