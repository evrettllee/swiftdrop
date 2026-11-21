import { UserVehicle } from '@/entities/admin-user';
import { Panel } from '@/shared/ui/panel';
import type { AdminUserCard } from '../api/admin-user-card';
import { USER_CARD_TEXTS as TEXTS } from '../config/texts';
import { courierNow } from '../lib/card-view';
import { Fact, Facts } from './Facts';

type WorkPanelProps = {
  courier: NonNullable<AdminUserCard['courier']>;
};

export function WorkPanel({ courier }: WorkPanelProps) {
  return (
    <Panel title={TEXTS.WORK}>
      <Facts>
        <Fact label={TEXTS.VEHICLE}>
          <UserVehicle type={courier.vehicleType} />
        </Fact>
        <Fact label={TEXTS.DELIVERED} className="tabular-nums">
          {courier.deliveredCount}
        </Fact>
        <Fact label={TEXTS.NOW} className="tabular-nums">
          {courierNow(courier)}
        </Fact>
      </Facts>
    </Panel>
  );
}
