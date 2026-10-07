import {
  BicycleIcon,
  CarIcon,
  PersonSimpleWalkIcon,
  ScooterIcon,
  TruckIcon,
  type Icon,
} from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '../../../../shared/constants/styles';
import { FEATURES } from '../../constants/sections';
import { FeatureCard } from './FeatureCard';
import { ResponsiveText } from '../ResponsiveText';

const { TRANSPORT } = FEATURES;

const VEHICLE_ICONS: Record<(typeof TRANSPORT.VEHICLES)[number]['id'], Icon> = {
  walk: PersonSimpleWalkIcon,
  bicycle: BicycleIcon,
  scooter: ScooterIcon,
  car: CarIcon,
  truck: TruckIcon,
};

// The five kinds of transport; the tiles are shown on a desktop only, as in the design.
export function TransportCard() {
  return (
    <FeatureCard
      tone="selected"
      wide
      className="lg:col-span-4"
      title={TRANSPORT.TITLE}
      text={<ResponsiveText full={TRANSPORT.TEXT} short={TRANSPORT.TEXT_SHORT} />}
    >
      <ul className="hidden grid-cols-5 gap-4 lg:grid">
        {TRANSPORT.VEHICLES.map(({ id, label }) => {
          const VehicleIcon = VEHICLE_ICONS[id];
          const isActive = id === TRANSPORT.ACTIVE_VEHICLE;

          return (
            <li key={id} className="flex flex-col items-center gap-2">
              <span
                className={`flex size-16 items-center justify-center rounded-lg border bg-surface ${isActive ? 'border-accent text-accent' : 'border-border'}`}
              >
                <VehicleIcon size={ICON_SIZE.XLARGE} weight={ICON_WEIGHT} aria-hidden="true" />
              </span>
              <span className={`text-small ${isActive ? 'font-semibold' : 'text-fg-secondary'}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </FeatureCard>
  );
}
