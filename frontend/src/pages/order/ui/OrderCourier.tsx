import type { ClientOrderCourier } from '@/shared/api';
import { Avatar } from '@/shared/ui/avatar';
import { Section } from '@/shared/ui/section';
import { ORDER_COURIER_TEXTS } from '../config/tracking';
import { formatCourierVehicle, getCourierInitials } from '../lib/courier';

type OrderCourierProps = {
  courier: NonNullable<ClientOrderCourier['courier']>;
};

// Who carries the order: the name the backend allows to show and the transport. The phone of the
// courier is not shown: the client does not call them from here.
export function OrderCourier({ courier }: OrderCourierProps) {
  const vehicle = courier.vehicle === null ? null : formatCourierVehicle(courier.vehicle);

  return (
    <Section title={ORDER_COURIER_TEXTS.SECTION}>
      <div className="flex items-center gap-3">
        <Avatar initials={getCourierInitials(courier.name)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span>{courier.name}</span>
          {vehicle === null ? null : (
            <span className="truncate text-small text-fg-secondary tabular-nums" title={vehicle}>
              {vehicle}
            </span>
          )}
        </div>
      </div>
    </Section>
  );
}
