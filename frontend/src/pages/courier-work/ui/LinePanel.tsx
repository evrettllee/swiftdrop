import { useId } from 'react';
import type { CourierVehicle } from '@/shared/api';
import type { GeoPoint } from '@/shared/lib/geo';
import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { LINE_TEXTS } from '../config/texts';
import type { LineSwitch } from '../model/useLineSwitch';
import { CourierLocationMap } from './CourierLocationMap';
import { VehicleRow } from './VehicleRow';

type LinePanelProps = {
  isOnline: boolean;
  isConnected: boolean;
  vehicle: CourierVehicle;
  point: GeoPoint | null;
  pending: LineSwitch | null;
  error: string | null;
  onGoOnline: () => void;
  onGoOffline: () => void;
};

// The line of the courier: on the desktop the button stands next to the title, on a phone it goes
// to the end of the panel and takes its width.
export function LinePanel({
  isOnline,
  isConnected,
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
      className="flex flex-col gap-4 rounded-xl border border-transparent bg-surface p-4 shadow-md lg:p-6 dark:border-border"
    >
      {isOnline ? <CourierLocationMap point={point} isSearching={isConnected} /> : null}
      {/* On the desktop the title and the button share a row; on a phone this block dissolves and
          the button goes to the end of the panel. */}
      <div className="contents lg:flex lg:items-center lg:justify-between lg:gap-6">
        <div aria-live="polite" className="flex min-w-0 flex-col gap-1">
          <h2 id={titleId} className="text-heading-md font-semibold">
            {isOnline ? LINE_TEXTS.ONLINE_TITLE : LINE_TEXTS.OFFLINE_TITLE}
          </h2>
          <p className="text-small text-wrap text-fg-secondary">
            {isOnline ? LINE_TEXTS.ONLINE_HINT : LINE_TEXTS.OFFLINE_HINT}
          </p>
        </div>
        <div className="order-last lg:order-none lg:shrink-0">
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
      </div>
      {error === null ? null : <InlineAlert variant="error">{error}</InlineAlert>}
      <VehicleRow vehicle={vehicle} canChange={!isOnline} />
    </section>
  );
}
