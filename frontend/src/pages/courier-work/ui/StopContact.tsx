import { NavigationArrowIcon, PhoneIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useCourierPosition } from '@/entities/courier';
import type { VehicleType } from '@/shared/api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatPhone } from '@/shared/lib/format';
import type { GeoPoint } from '@/shared/lib/geo';
import { LinkButton } from '@/shared/ui/button';
import { ORDER_TEXTS } from '../config/texts';
import { buildNavigatorHref, buildTelHref } from '../lib/order-links';

type StopContactProps = {
  // «Отправитель» or «Получатель».
  role: string;
  contact: { name: string; phone: string | null };
  // Whom «Позвонить» calls, for screen readers.
  callLabel: string;
  point: GeoPoint;
  vehicle: VehicleType;
  chatButton: ReactNode;
};

// The person at the point and the two ways to reach it: the navigator from where the courier is,
// and a call. Without a phone there is nothing to show or to call.
export function StopContact({
  role,
  contact,
  callLabel,
  point,
  vehicle,
  chatButton,
}: StopContactProps) {
  const { phone } = contact;
  const position = useCourierPosition();

  return (
    <>
      <dl className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-6">
        <div className="flex min-w-0 flex-col">
          <dt className="text-small text-fg-secondary">{role}</dt>
          <dd>{contact.name}</dd>
        </div>
        {phone === null ? null : (
          <div className="flex min-w-0 flex-col">
            <dt className="text-small text-fg-secondary">{ORDER_TEXTS.PHONE}</dt>
            <dd className="tabular-nums">{formatPhone(phone)}</dd>
          </div>
        )}
      </dl>
      {/* The navigator opens in a new tab: the cabinet keeps sending the position. */}
      <div className="flex flex-col gap-2 lg:flex-row">
        <LinkButton
          variant="secondary"
          href={buildNavigatorHref(point, vehicle, position)}
          isExternal
          icon={
            <NavigationArrowIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
          }
        >
          {ORDER_TEXTS.ROUTE}
        </LinkButton>
        {phone === null ? null : (
          <LinkButton
            variant="secondary"
            href={buildTelHref(phone)}
            label={callLabel}
            icon={<PhoneIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
          >
            {ORDER_TEXTS.CALL}
          </LinkButton>
        )}
        {chatButton}
      </div>
    </>
  );
}
