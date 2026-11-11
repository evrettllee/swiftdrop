import { CourierShiftEventsService } from '@/modules/couriers/services/courier-shift-events.service';
import { SOCKET_EVENTS } from '../constants/socket-events.constants';
import {
  staffCourierEventSchema,
  staffCourierLocationEventSchema,
} from '../dto/staff-courier-event.dto';
import { toStaffCourierLocation } from '../utils/staff-courier-event';
import type { RealtimeEventsService } from './realtime-events.service';
import { StaffCourierEventsService } from './staff-courier-events.service';

describe('StaffCourierEventsService', () => {
  it.each([
    [true, 'online'],
    [false, 'offline'],
  ])('should send staff:courier %s as %s to the staff room', (isAvailable, kind) => {
    const toStaff = jest.fn();
    const shiftEvents = new CourierShiftEventsService();
    const service = new StaffCourierEventsService(shiftEvents, {
      toStaff,
    } as unknown as RealtimeEventsService);

    service.onModuleInit();
    shiftEvents.publish({ courierProfileId: 5, isAvailable });

    expect(toStaff).toHaveBeenCalledWith(SOCKET_EVENTS.STAFF_COURIER, { courierId: 5, kind });
    expect(staffCourierEventSchema.safeParse(toStaff.mock.calls[0][1]).success).toBe(true);
  });
});

describe('toStaffCourierLocation', () => {
  it('should keep only the courier id, the point and its time', () => {
    const event = toStaffCourierLocation({
      courierProfileId: 5,
      latitude: 53.9,
      longitude: 27.55,
      updatedAt: '2026-10-30T12:00:00.000Z',
    });

    expect(event).toEqual({ courierId: 5, lat: 53.9, lng: 27.55, at: '2026-10-30T12:00:00.000Z' });
    expect(staffCourierLocationEventSchema.safeParse(event).success).toBe(true);
  });

  it.each([
    [{ courierId: 5, lat: 91, lng: 27, at: '2026-10-30T12:00:00.000Z' }],
    [{ courierId: 5, lat: 53, lng: 27, at: '2026-10-30T12:00:00.000Z', name: 'Дмитрий' }],
  ])('should refuse a payload out of range or with personal data: %j', (payload) => {
    expect(staffCourierLocationEventSchema.safeParse(payload).success).toBe(false);
  });
});
