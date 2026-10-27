import { Injectable } from '@nestjs/common';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import { OfferViewsService } from './offer-views.service';

@Injectable()
export class OfferNotifierService {
  constructor(
    private readonly views: OfferViewsService,
    private readonly events: RealtimeEventsService,
  ) {}

  // Sends a new offer to every open tab of its courier. A courier with no tab open sees it on
  // the next visit through the current offer request.
  async announce(offerId: number, courierProfileId: number): Promise<void> {
    const offer = await this.views.findById(offerId);

    if (offer) {
      this.events.toCourier(courierProfileId, SOCKET_EVENTS.OFFER_NEW, offer);
    }
  }

  // Tells the courier to close the offer window.
  withdraw(offerId: number, courierProfileId: number): void {
    this.events.toCourier(courierProfileId, SOCKET_EVENTS.OFFER_CLOSED, { offerId });
  }
}
