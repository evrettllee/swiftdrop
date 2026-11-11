import { Injectable, Logger } from '@nestjs/common';
import { describeError } from '@/common/utils/describe-error';
import type { CourierShiftEvent } from '../types/couriers.types';

type CourierShiftListener = (event: CourierShiftEvent) => void;

@Injectable()
export class CourierShiftEventsService {
  private readonly logger = new Logger(CourierShiftEventsService.name);
  private readonly listeners: CourierShiftListener[] = [];

  subscribe(listener: CourierShiftListener): void {
    this.listeners.push(listener);
  }

  publish(event: CourierShiftEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        this.logger.error(
          `Shift change of courier ${event.courierProfileId} not handled: ${describeError(error)}`,
        );
      }
    }
  }
}
