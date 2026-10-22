import { Injectable, Logger } from '@nestjs/common';
import { describeError } from '../../../common/utils/describe-error';
import type { CourierLocationEvent } from '../types/couriers-socket.types';

type CourierLocationListener = (event: CourierLocationEvent) => void;

// Positions stored during an active order, for the modules that react to them (the arrival
// estimate). They subscribe here, so this module never depends on them.
@Injectable()
export class CourierLocationEventsService {
  private readonly logger = new Logger(CourierLocationEventsService.name);
  private readonly listeners: CourierLocationListener[] = [];

  subscribe(listener: CourierLocationListener): void {
    this.listeners.push(listener);
  }

  // A failing listener is logged and does not keep the others from the position.
  publish(event: CourierLocationEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        this.logger.error(
          `Position of order ${event.orderId} not handled: ${describeError(error)}`,
        );
      }
    }
  }
}
