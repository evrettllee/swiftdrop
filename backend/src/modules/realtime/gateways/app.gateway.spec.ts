import type { Socket } from 'socket.io';
import { ROLE } from '@/common/enums/role.enum';
import { LOCATION_UPDATE_REJECTIONS } from '@/modules/couriers/constants/courier-location.constants';
import type { CourierLocationEventsService } from '@/modules/couriers/services/courier-location-events.service';
import type { CourierLocationService } from '@/modules/couriers/services/courier-location.service';
import { courierRoom, STAFF_ROOM, userRoom } from '../constants/realtime.constants';
import type { OrderRoomsService } from '../services/order-rooms.service';
import type { RealtimeEventsService } from '../services/realtime-events.service';
import type { SocketAdmissionService } from '../services/socket-admission.service';
import type { SocketSessionTimersService } from '../services/socket-session-timers.service';
import type { AppSocketData } from '../types/realtime.types';
import { AppGateway } from './app.gateway';

const USER_ID = 7;
const COURIER_PROFILE_ID = 3;

function socketData(role: AppSocketData['role']): AppSocketData {
  const common = {
    userId: USER_ID,
    sessionExpiresAtMs: Date.now() + 60_000,
    orderJoinAttemptsMs: [],
  };

  return role === ROLE.COURIER
    ? { ...common, role, courierProfileId: COURIER_PROFILE_ID, lastLocationAtMs: null }
    : ({ ...common, role } as AppSocketData);
}

describe('AppGateway', () => {
  const update = jest.fn();
  const gateway = new AppGateway(
    {} as SocketAdmissionService,
    { update } as unknown as CourierLocationService,
    {} as OrderRoomsService,
    { schedule: jest.fn(), clear: jest.fn() } as unknown as SocketSessionTimersService,
    {} as CourierLocationEventsService,
    {} as RealtimeEventsService,
  );

  async function roomsJoinedBy(role: AppSocketData['role']): Promise<unknown> {
    const join = jest.fn(() => Promise.resolve());

    await gateway.handleConnection({
      id: 'socket',
      data: socketData(role),
      join,
    } as unknown as Socket);

    return join.mock.calls[0];
  }

  it('should put a client into their user room only', async () => {
    await expect(roomsJoinedBy(ROLE.CLIENT)).resolves.toEqual([[userRoom(USER_ID)]]);
  });

  it('should put a courier into their user and courier rooms', async () => {
    await expect(roomsJoinedBy(ROLE.COURIER)).resolves.toEqual([
      [userRoom(USER_ID), courierRoom(COURIER_PROFILE_ID)],
    ]);
  });

  it.each([ROLE.MANAGER, ROLE.ADMIN])(
    'should put a %s into their user room and the staff room',
    async (role) => {
      await expect(roomsJoinedBy(role)).resolves.toEqual([[userRoom(USER_ID), STAFF_ROOM]]);
    },
  );

  it.each([ROLE.CLIENT, ROLE.MANAGER, ROLE.ADMIN])(
    'should refuse a position from a %s socket without reading it',
    (role) => {
      const socket = { data: socketData(role) } as unknown as Socket;

      expect(gateway.updateLocation(socket, { latitude: 53.9, longitude: 27.56 })).toEqual({
        ok: false,
        reason: LOCATION_UPDATE_REJECTIONS.FORBIDDEN,
      });
      expect(update).not.toHaveBeenCalled();
    },
  );
});
