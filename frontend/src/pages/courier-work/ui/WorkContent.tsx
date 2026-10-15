import type { CourierMe, CourierVehicle } from '@/shared/api';
import { CONNECTION_STATUS, useConnectionStatus } from '@/shared/realtime';
import { Divider } from '@/shared/ui/divider';
import { LINE_SWITCH, useLineSwitch } from '../model/useLineSwitch';
import { useLocationSharing } from '../model/useLocationSharing';
import { useTodayStats } from '../model/useTodayStats';
import { ActiveOrderNotice } from './ActiveOrderNotice';
import { GeoAlert } from './GeoAlert';
import { LinePanel } from './LinePanel';
import { TodayStats } from './TodayStats';

type WorkContentProps = {
  profile: CourierMe;
  vehicle: CourierVehicle;
};

// The line, the position sent while on it, and the results of the day.
export function WorkContent({ profile, vehicle }: WorkContentProps) {
  const connection = useConnectionStatus();
  const stats = useTodayStats();
  const isOnline = profile.isAvailable;
  const location = useLocationSharing(isOnline && connection === CONNECTION_STATUS.CONNECTED);
  const line = useLineSwitch({
    sendPoint: location.sendNow,
    onSwitched: (isAvailable) => {
      stats.reload();

      if (!isAvailable) {
        location.reset();
      }
    },
  });

  return (
    <>
      {line.geoProblem === null ? null : (
        <GeoAlert
          problem={line.geoProblem}
          isChecking={line.pending === LINE_SWITCH.ON}
          onRetry={() => void line.goOnline()}
        />
      )}
      {profile.activeOrderId === null ? (
        <LinePanel
          isOnline={isOnline}
          vehicle={vehicle}
          point={location.point}
          pending={line.pending}
          error={line.error}
          onGoOnline={() => void line.goOnline()}
          onGoOffline={() => void line.goOffline()}
        />
      ) : (
        <ActiveOrderNotice />
      )}
      {/* The line keeps the space of the design: the gap of the page and 8px on each side. */}
      <div className="py-2">
        <Divider />
      </div>
      <TodayStats state={stats} onRetry={stats.reload} />
    </>
  );
}
