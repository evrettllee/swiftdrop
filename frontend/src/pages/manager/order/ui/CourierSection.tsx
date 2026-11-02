import { ArrowsLeftRightIcon, PhoneIcon } from '@phosphor-icons/react';
import { formatCourierVehicle, formatCourierVehicleShort } from '@/entities/courier';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { buildTelHref, formatPhone, getNameInitials } from '@/shared/lib/format';
import type { ManagerOrderCourier } from '@/shared/staff-api';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { OutlineIconLink } from '@/shared/ui/icon-button';
import { Section } from '@/shared/ui/section';
import { ACTION_TEXTS, MANAGER_ORDER_TEXTS } from '../config/texts';
import { toCourierVehicle } from '../lib/order-facts';

const DETAILS_SEPARATOR = ', ';

type CourierSectionProps = {
  courier: ManagerOrderCourier;
  onReassign: (() => void) | null;
};

export function CourierSection({ courier, onReassign }: CourierSectionProps) {
  const vehicle = courier.vehicle === null ? null : toCourierVehicle(courier.vehicle);
  const phone = courier.phone === null ? null : formatPhone(courier.phone);
  const telHref = courier.phone === null ? null : buildTelHref(courier.phone);
  const details = [vehicle === null ? null : formatCourierVehicle(vehicle), phone]
    .filter((part) => part !== null)
    .join(DETAILS_SEPARATOR);
  const shortDetails = vehicle === null ? null : formatCourierVehicleShort(vehicle);

  return (
    <Section title={MANAGER_ORDER_TEXTS.SECTION_COURIER}>
      <div className="flex items-center gap-3">
        <Avatar initials={getNameInitials(courier.name)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate">{courier.name}</span>
          <span className="hidden text-small text-pretty text-fg-secondary tabular-nums lg:inline">
            {details}
          </span>
          {shortDetails === null ? null : (
            <span className="truncate text-small text-fg-secondary tabular-nums lg:hidden">
              {shortDetails}
            </span>
          )}
        </div>
        {telHref === null ? null : (
          <OutlineIconLink href={telHref} aria-label={MANAGER_ORDER_TEXTS.CALL_COURIER}>
            <PhoneIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
          </OutlineIconLink>
        )}
        {onReassign === null ? null : (
          <span className="hidden lg:contents">
            <Button
              variant="secondary"
              icon={
                <ArrowsLeftRightIcon
                  size={ICON_SIZE.MEDIUM}
                  weight={ICON_WEIGHT}
                  aria-hidden="true"
                />
              }
              onClick={onReassign}
            >
              {ACTION_TEXTS.REASSIGN_SHORT}
            </Button>
          </span>
        )}
      </div>
    </Section>
  );
}
