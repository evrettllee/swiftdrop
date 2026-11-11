import type { Socket } from 'socket.io';
import { ROLE } from '@/common/enums/role.enum';
import type { Database } from '@/database/database.module';
import { ORDER_JOIN_REJECTIONS, PARTICIPANT_ACCESS } from '../constants/realtime.constants';
import type { AppSocketData } from '../types/realtime.types';
import { OrderRoomsService } from './order-rooms.service';

const ORDER_ID = 42;
const LATER_MS = Date.now() + 60_000;

function fakeSocket(data: AppSocketData) {
  const join = jest.fn(() => Promise.resolve());

  return {
    socket: { data, rooms: new Set(['socket-id']), connected: true, join } as unknown as Socket,
    join,
  };
}

function socketData(role: AppSocketData['role']): AppSocketData {
  const common = { userId: 7, sessionExpiresAtMs: LATER_MS, orderJoinAttemptsMs: [] };

  return role === ROLE.COURIER
    ? { ...common, role, courierProfileId: 3, lastLocationAtMs: null }
    : ({ ...common, role } as AppSocketData);
}

describe('OrderRoomsService.join', () => {
  const service = new OrderRoomsService({} as Database);
  const participantAccess = jest.spyOn(service, 'participantAccess');

  beforeEach(() => {
    participantAccess.mockReset();
  });

  it.each([ROLE.MANAGER, ROLE.ADMIN])(
    'should answer a %s with not_found without reading the order',
    async (role) => {
      const { socket, join } = fakeSocket(socketData(role));

      await expect(service.join(socket, { orderId: ORDER_ID })).resolves.toEqual({
        ok: false,
        reason: ORDER_JOIN_REJECTIONS.NOT_FOUND,
      });
      expect(participantAccess).not.toHaveBeenCalled();
      expect(join).not.toHaveBeenCalled();
    },
  );

  it('should still refuse an invalid body of a staff socket as invalid', async () => {
    const { socket } = fakeSocket(socketData(ROLE.MANAGER));

    await expect(service.join(socket, { orderId: 'x' })).resolves.toEqual({
      ok: false,
      reason: ORDER_JOIN_REJECTIONS.INVALID,
    });
  });

  it.each([ROLE.CLIENT, ROLE.COURIER])('should let a %s who takes part in', async (role) => {
    participantAccess.mockResolvedValue(PARTICIPANT_ACCESS.MEMBER);
    const { socket, join } = fakeSocket(socketData(role));

    await expect(service.join(socket, { orderId: ORDER_ID })).resolves.toEqual({ ok: true });
    expect(join).toHaveBeenCalledWith(`order:${ORDER_ID}`);
  });
});
