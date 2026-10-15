import type { CourierMe, CourierVehicle } from '@/shared/api';
import { CONNECTION_STATUS, useConnectionStatus } from '@/shared/realtime';
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
  const isConnected = connection === CONNECTION_STATUS.CONNECTED;
  const location = useLocationSharing(isOnline && isConnected);
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
    <>
      {geoProblem === null ? null : (
        <GeoAlert
          problem={geoProblem}
          isChecking={isOnline ? location.isChecking : line.pending === LINE_SWITCH.ON}
          onRetry={() => void (isOnline ? location.recheck() : line.goOnline())}
        />
      )}
      {profile.activeOrderId === null ? (
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
      ) : (
        <ActiveOrderNotice />
      )}
      <TodayStats state={stats} onRetry={stats.reload} />
    </>
  );
}
