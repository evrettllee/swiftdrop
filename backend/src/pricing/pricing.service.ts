import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../common/constants/database';
import { SECONDS_PER_MINUTE } from '../common/constants/time';
import { findLightestVehicle } from '../common/utils/vehicle-fit';
import { DRIZZLE } from '../database/database.constants';
import type { Database } from '../database/database.module';
import { tariffs } from '../db/schema';
import { OsrmService } from '../integrations/osrm/osrm.service';
import { ZonesService } from '../zones/zones.service';
import type { EstimatePriceDto } from './dto/estimate-price.dto';
import { calculatePrice } from './pricing.calculator';
import {
  CURRENCY,
  DISTANCE_PRECISION_FACTOR,
  NEUTRAL_COEFFICIENT,
  PICKUP_BUFFER_MINUTES,
  PRICING_ERROR_MESSAGES,
} from './pricing.constants';
import type { PriceEstimate, TariffRates } from './pricing.types';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly zones: ZonesService,
    private readonly osrm: OsrmService,
  ) {}

  async estimate(dto: EstimatePriceDto): Promise<PriceEstimate> {
    const vehicleType = findLightestVehicle(dto.package);

    if (vehicleType === null) {
      throw new UnprocessableEntityException(PRICING_ERROR_MESSAGES.NO_VEHICLE);
    }

    const [pickupZone, deliveryZone] = await Promise.all([
      this.zones.findZoneForPoint(dto.pickup),
      this.zones.findZoneForPoint(dto.delivery),
    ]);

    if (!pickupZone) {
      throw new UnprocessableEntityException(PRICING_ERROR_MESSAGES.PICKUP_OUT_OF_ZONE);
    }

    if (!deliveryZone) {
      throw new UnprocessableEntityException(PRICING_ERROR_MESSAGES.DELIVERY_OUT_OF_ZONE);
    }

    const [rates, route] = await Promise.all([
      this.loadRates(pickupZone.tariffId),
      this.osrm.getRoute(dto.pickup, dto.delivery),
    ]);

    // Rounded before pricing, so the price matches the distance that an order will store.
    const distanceKm =
      Math.round(route.distanceKm * DISTANCE_PRECISION_FACTOR) / DISTANCE_PRECISION_FACTOR;
    const coefficient = NEUTRAL_COEFFICIENT;

    return {
      price: calculatePrice({ distanceKm, spec: dto.package, vehicleType, rates, coefficient }),
      currency: CURRENCY,
      distanceKm,
      estimatedMinutes: Math.ceil(route.durationSec / SECONDS_PER_MINUTE) + PICKUP_BUFFER_MINUTES,
      coefficient,
    };
  }

  private async loadRates(tariffId: number): Promise<TariffRates> {
    const [tariff] = await this.db
      .select({
        pricePerKm: tariffs.pricePerKm,
        pricePerKg: tariffs.pricePerKg,
        minPrice: tariffs.minPrice,
        fragileFee: tariffs.fragileFee,
      })
      .from(tariffs)
      .where(eq(tariffs.tariffId, tariffId))
      .limit(SINGLE_ROW_LIMIT);

    if (!tariff) {
      this.logger.error(`Tariff ${tariffId} of the matched zone was not found`);
      throw new InternalServerErrorException(PRICING_ERROR_MESSAGES.TARIFF_NOT_FOUND);
    }

    // numeric columns come back from Postgres as strings.
    return {
      pricePerKm: Number(tariff.pricePerKm),
      pricePerKg: Number(tariff.pricePerKg),
      minPrice: Number(tariff.minPrice),
      fragileFee: Number(tariff.fragileFee),
    };
  }
}
