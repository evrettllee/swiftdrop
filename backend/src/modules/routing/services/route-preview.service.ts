import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PRICING_ERROR_MESSAGES } from '../../pricing/constants/pricing.constants';
import { ZonesService } from '../../zones/services/zones.service';
import type { RoutePreviewDto } from '../dto/route-preview.dto';
import type { RouteLines } from '../types/routing.types';
import { RouteLinesService } from './route-lines.service';

// The route before an order exists: only points the service area covers, with the answers of the
// price estimate, so the map and the price refuse the same points.
@Injectable()
export class RoutePreviewService {
  constructor(
    private readonly zones: ZonesService,
    private readonly lines: RouteLinesService,
  ) {}

  async preview(dto: RoutePreviewDto): Promise<RouteLines> {
    const [pickupZone, deliveryZone] = await this.zones.findZonesForPoints([
      dto.pickup,
      dto.delivery,
    ]);

    if (!pickupZone) {
      throw new UnprocessableEntityException(PRICING_ERROR_MESSAGES.PICKUP_OUT_OF_ZONE);
    }

    if (!deliveryZone) {
      throw new UnprocessableEntityException(PRICING_ERROR_MESSAGES.DELIVERY_OUT_OF_ZONE);
    }

    return this.lines.forPreview(dto.pickup, dto.delivery);
  }
}
