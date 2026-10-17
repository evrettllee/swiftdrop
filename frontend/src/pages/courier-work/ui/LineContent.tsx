import type { LocationSharing } from '@/features/courier-location';
import type { CourierMe, CourierVehicle } from '@/shared/api';
import { PageTitle } from '@/shared/ui/page-title';
import { COURIER_WORK_TEXTS } from '../config/texts';
import { LINE_SWITCH, useLineSwitch } from '../model/useLineSwitch';
import { useTodayStats } from '../model/useTodayStats';
import { ConnectionAlert } from './ConnectionAlert';
import { GeoAlert } from './GeoAlert';
import { LinePanel } from './LinePanel';
import { TodayStats } from './TodayStats';

type LineContentProps = {
  profile: CourierMe;
  vehicle: CourierVehicle;
  isConnected: boolean;
  location: LocationSharing;
};

// The line and the results of the day, while the courier carries no order.
export function LineContent({ profile, vehicle, isConnected, location }: LineContentProps) {
  const stats = useTodayStats();
  const isOnline = profile.isAvailable;
  const line = useLineSwitch({
    sendPoint: location.sendNow,
    onSwitched: (isAvailable) => {
      stats.reload();

      if (!isAvailable) {
        location.reset();
      }
    },
  });

  // Off the line the problem is of going on it; on the line, of the position that was lost.
  const geoProblem = isOnline ? location.problem : line.geoProblem;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageTitle>{COURIER_WORK_TEXTS.PAGE_TITLE}</PageTitle>
      <ConnectionAlert />
      {geoProblem === null ? null : (
        <GeoAlert
          problem={geoProblem}
          isChecking={isOnline ? location.isChecking : line.pending === LINE_SWITCH.ON}
          onRetry={() => void (isOnline ? location.recheck() : line.goOnline())}
        />
      )}
      <LinePanel
        isOnline={isOnline}
        isConnected={isConnected}
        vehicle={vehicle}
        point={location.point}
        pending={line.pending}
        error={line.error}
        onGoOnline={() => void line.goOnline()}
        onGoOffline={() => void line.goOffline()}
      />
      <TodayStats state={stats} onRetry={stats.reload} />
    </div>
  );
}
