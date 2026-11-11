import { Logger } from '@nestjs/common';
import type { Namespace } from 'socket.io';
import { courierRoom, orderRoom, STAFF_ROOM, userRoom } from '../constants/realtime.constants';
import { RealtimeEventsService } from './realtime-events.service';

const EVENT = 'test:event';
const PAYLOAD = { value: 1 };

function fakeNamespace() {
  const emit = jest.fn();
  const except = jest.fn(() => ({ emit }));
  const to = jest.fn(() => ({ emit, except }));
  const socketsLeave = jest.fn();
  const disconnectSockets = jest.fn();
  const inRoom = jest.fn(() => ({ socketsLeave, disconnectSockets }));
  const namespace = { to, in: inRoom } as unknown as Namespace;

  return { namespace, emit, except, to, inRoom, socketsLeave, disconnectSockets };
}

describe('RealtimeEventsService', () => {
  const logError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  let service: RealtimeEventsService;

  beforeEach(() => {
    logError.mockClear();
    service = new RealtimeEventsService();
  });

  afterAll(() => {
    logError.mockRestore();
  });

  it('should do nothing and not throw before the namespace is attached', () => {
    expect(() => {
      service.toOrder(1, EVENT, PAYLOAD, { exceptCourierProfileId: 2 });
      service.toCourier(2, EVENT, PAYLOAD);
      service.toUser(3, EVENT, PAYLOAD);
      service.toStaff(EVENT, PAYLOAD);
      service.removeCourierFromOrder(1, 2);
      service.disconnectUser(3);
    }).not.toThrow();
    expect(logError).not.toHaveBeenCalled();
  });

  it('should send to the room of each target', () => {
    const fake = fakeNamespace();
    service.attach(fake.namespace);

    service.toOrder(1, EVENT, PAYLOAD);
    service.toCourier(2, EVENT, PAYLOAD);
    service.toUser(3, EVENT, PAYLOAD);
    service.toStaff(EVENT, PAYLOAD);

    expect(fake.to.mock.calls).toEqual([
      [orderRoom(1)],
      [courierRoom(2)],
      [userRoom(3)],
      [STAFF_ROOM],
    ]);
    expect(fake.emit).toHaveBeenCalledTimes(4);
    expect(fake.emit).toHaveBeenCalledWith(EVENT, PAYLOAD);
    expect(fake.except).not.toHaveBeenCalled();
  });

  it('should leave the sockets of a courier out of an order event when asked', () => {
    const fake = fakeNamespace();
    service.attach(fake.namespace);

    service.toOrder(1, EVENT, PAYLOAD, { exceptCourierProfileId: 2 });

    expect(fake.except).toHaveBeenCalledWith(courierRoom(2));
    expect(fake.emit).toHaveBeenCalledWith(EVENT, PAYLOAD);
  });

  it('should take a courier out of an order room and close the sockets of a user', () => {
    const fake = fakeNamespace();
    service.attach(fake.namespace);

    service.removeCourierFromOrder(1, 2);
    service.disconnectUser(3);

    expect(fake.inRoom.mock.calls).toEqual([[courierRoom(2)], [userRoom(3)]]);
    expect(fake.socketsLeave).toHaveBeenCalledWith(orderRoom(1));
    expect(fake.disconnectSockets).toHaveBeenCalledWith(true);
  });

  it('should log a failed send without throwing', () => {
    const fake = fakeNamespace();
    fake.emit.mockImplementation(() => {
      throw new Error('socket server is down');
    });
    fake.disconnectSockets.mockImplementation(() => {
      throw new Error('adapter failed');
    });
    service.attach(fake.namespace);

    expect(() => {
      service.toOrder(1, EVENT, PAYLOAD);
      service.toStaff(EVENT, PAYLOAD);
      service.disconnectUser(3);
    }).not.toThrow();
    expect(logError).toHaveBeenCalledTimes(3);
  });

  it('should keep the payload out of the log', () => {
    const fake = fakeNamespace();
    fake.emit.mockImplementation(() => {
      throw new Error('socket server is down');
    });
    service.attach(fake.namespace);

    service.toOrder(1, EVENT, { phone: '+375291234567' });

    expect(String(logError.mock.calls[0]?.[0])).not.toContain('+375291234567');
  });
});
