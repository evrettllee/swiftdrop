import { Injectable, type OnModuleInit } from '@nestjs/common';
import { CourierShiftEventsService } from '@/modules/couriers/services/courier-shift-events.service';
import type { CourierShiftEvent } from '@/modules/couriers/types/couriers.types';
import { SOCKET_EVENTS, STAFF_COURIER_EVENT_KIND } from '../constants/socket-events.constants';
import type { StaffCourierEvent } from '../types/realtime.types';
import { RealtimeEventsService } from './realtime-events.service';

@Injectable()
export class StaffCourierEventsService implements OnModuleInit {
  constructor(
    private readonly shiftEvents: CourierShiftEventsService,
    private readonly events: RealtimeEventsService,
  ) {}

  onModuleInit(): void {
    this.shiftEvents.subscribe((change) => this.publishShift(change));
  }

  publishShift({ courierProfileId, isAvailable }: CourierShiftEvent): void {
    const event: StaffCourierEvent = {
      courierId: courierProfileId,
      kind: isAvailable ? STAFF_COURIER_EVENT_KIND.ONLINE : STAFF_COURIER_EVENT_KIND.OFFLINE,
    };

    this.events.toStaff(SOCKET_EVENTS.STAFF_COURIER, event);
  }
}
