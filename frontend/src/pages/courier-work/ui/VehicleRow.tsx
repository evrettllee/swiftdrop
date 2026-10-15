import { VEHICLE_TYPE_META, formatVehicleDetails } from '@/entities/courier';
import type { CourierVehicle } from '@/shared/api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import { LinkButton } from '@/shared/ui/button';
import { LINE_TEXTS } from '../config/texts';

type VehicleRowProps = {
  vehicle: CourierVehicle;
  // The vehicle cannot change while the courier is on the line.
  canChange: boolean;
};

// The transport of the courier: its type and, for a car or a truck, the brand, the model and the plate.
export function VehicleRow({ vehicle, canChange }: VehicleRowProps) {
  const { label, icon: VehicleIcon } = VEHICLE_TYPE_META[vehicle.type];
  const details = formatVehicleDetails(vehicle);

  return (
    <div className="flex items-center gap-3 lg:col-span-2">
      <VehicleIcon
        size={ICON_SIZE.LARGE}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="shrink-0 text-fg-secondary"
      />
      <div className="flex min-w-0 grow flex-col">
        <span>{label}</span>
        {details === null ? null : (
          <span className="truncate text-small text-fg-secondary tabular-nums">{details}</span>
        )}
      </div>
      {canChange ? (
        // The text button reaches the edge of the panel, as in the design: its own padding stays.
        <div className="-me-4 shrink-0">
          <LinkButton variant="text" to={APP_ROUTES.COURIER_VEHICLE}>
            {LINE_TEXTS.CHANGE_VEHICLE}
          </LinkButton>
        </div>
      ) : null}
    </div>
  );
}
