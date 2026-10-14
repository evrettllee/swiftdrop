import { Injectable } from '@nestjs/common';
import { COURIER_SOCKET_EVENTS } from '../../couriers/constants/couriers-socket.constants';
import { CouriersGateway } from '../../couriers/gateways/couriers.gateway';
import { OfferViewsService } from './offer-views.service';

@Injectable()
export class OfferNotifierService {
  constructor(
    private readonly views: OfferViewsService,
    private readonly gateway: CouriersGateway,
  ) {}

  // Sends a new offer to every open tab of its courier. A courier with no tab open sees it on
  // the next visit through the current offer request.
  async announce(offerId: number, courierProfileId: number): Promise<void> {
    const offer = await this.views.findById(offerId);

    if (offer) {
      this.gateway.emitToCourier(courierProfileId, COURIER_SOCKET_EVENTS.OFFER_NEW, offer);
    }
  }
}
