import { useId } from 'react';
import type { CourierVehicle } from '@/shared/api';
import type { GeoPoint } from '@/shared/lib/geo';
import { Button } from '@/shared/ui/button';
import { Divider } from '@/shared/ui/divider';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { LINE_TEXTS } from '../config/texts';
import type { LineSwitch } from '../model/useLineSwitch';
import { CourierLocationMap } from './CourierLocationMap';
import { VehicleRow } from './VehicleRow';

type LinePanelProps = {
  isOnline: boolean;
  vehicle: CourierVehicle;
  point: GeoPoint | null;
  pending: LineSwitch | null;
  error: string | null;
  onGoOnline: () => void;
  onGoOffline: () => void;
};

// The line of the courier. A grid: on the desktop the button stands next to the title, on a phone
// it goes to the end of the panel and takes its width.
export function LinePanel({
  isOnline,
  vehicle,
  point,
  pending,
  error,
  onGoOnline,
  onGoOffline,
}: LinePanelProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-xl border border-transparent bg-surface p-4 shadow-md lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-6 lg:p-6 dark:border-border"
    >
      {isOnline ? (
        <div className="lg:col-span-2">
          <CourierLocationMap point={point} />
        </div>
      ) : null}
      <div aria-live="polite" className="flex flex-col gap-1">
        <h2 id={titleId} className="text-heading-md font-semibold">
          {isOnline ? LINE_TEXTS.ONLINE_TITLE : LINE_TEXTS.OFFLINE_TITLE}
        </h2>
        <p className="text-small text-fg-secondary">
          {isOnline ? LINE_TEXTS.ONLINE_HINT : LINE_TEXTS.OFFLINE_HINT}
        </p>
      </div>
      <div className="order-last lg:order-none lg:self-center lg:justify-self-end">
        <Button
          variant={isOnline ? 'secondary' : 'primary'}
          fullWidth
          loading={pending !== null}
          disabled={pending !== null}
          onClick={isOnline ? onGoOffline : onGoOnline}
        >
          {isOnline ? LINE_TEXTS.GO_OFFLINE : LINE_TEXTS.GO_ONLINE}
        </Button>
      </div>
      {error === null ? null : (
        <div className="lg:col-span-2">
          <InlineAlert variant="error">{error}</InlineAlert>
        </div>
      )}
      {/* The line keeps the space of the design: the gap of the panel and 8px on each side. */}
      <div className="py-2 lg:col-span-2">
        <Divider />
      </div>
      <VehicleRow vehicle={vehicle} canChange={!isOnline} />
    </section>
  );
}
