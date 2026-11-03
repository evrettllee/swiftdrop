import { PhoneIcon, XIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { buildTelHref, getNameInitials } from '@/shared/lib/format';
import { getManagerOrderPath } from '@/shared/routes';
import { Avatar } from '@/shared/ui/avatar';
import { LinkButton } from '@/shared/ui/button';
import { IconButton, OutlineIconLink } from '@/shared/ui/icon-button';
import { CARD_TEXTS } from '../config/texts';
import type { LiveCourier } from '../lib/courier-state';
import { etaMinutes, orderLinkOf, positionAgo, stateLabel } from '../lib/courier-view';
import { vehicleLabel } from '../lib/vehicle';
import { useOrderEta } from '../model/useOrderEta';
import { StateMark } from './StateMark';

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-small">
      <dt className="text-fg-secondary">{label}</dt>
      <dd className="text-end font-semibold tabular-nums">{children}</dd>
    </div>
  );
}

type CourierCardProps = {
  courier: LiveCourier;
  now: number;
  onClose: () => void;
};

export function CourierCard({ courier, now, onClose }: CourierCardProps) {
  const order = orderLinkOf(courier);
  const eta = useOrderEta(courier.activeOrder?.orderId ?? null);
  const position = positionAgo(courier, now);
  const telHref = courier.phone === null ? null : buildTelHref(courier.phone);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar initials={getNameInitials(courier.name)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold">{courier.name}</span>
          <span className="truncate text-small text-fg-secondary">
            {vehicleLabel(courier.vehicleType)}
          </span>
        </div>
        <IconButton aria-label={CARD_TEXTS.CLOSE} onClick={onClose} className="-me-3 shrink-0">
          <XIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
        </IconButton>
      </div>
      <dl className="flex flex-col gap-2">
        <Fact label={CARD_TEXTS.STATE}>
          <StateMark state={courier.state} text={stateLabel(courier.state)} />
        </Fact>
        {order === null ? null : (
          <Fact label={CARD_TEXTS.ORDER}>
            <Link
              to={getManagerOrderPath(order.orderId)}
              className="rounded-sm text-accent hover:underline"
            >
              {order.text}
            </Link>
          </Fact>
        )}
        {eta === null || courier.activeOrder === null ? null : (
          <Fact label={CARD_TEXTS.TO_RECIPIENT}>{CARD_TEXTS.eta(etaMinutes(eta, now))}</Fact>
        )}
        {position === null ? null : <Fact label={CARD_TEXTS.POSITION}>{position}</Fact>}
      </dl>
      <div className="flex gap-2">
        {telHref === null ? null : (
          <OutlineIconLink href={telHref} aria-label={CARD_TEXTS.CALL}>
            <PhoneIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
          </OutlineIconLink>
        )}
        {order === null ? null : (
          <div className="flex-1">
            <LinkButton variant="secondary" fullWidth to={getManagerOrderPath(order.orderId)}>
              {CARD_TEXTS.OPEN_ORDER}
            </LinkButton>
          </div>
        )}
      </div>
    </div>
  );
}
