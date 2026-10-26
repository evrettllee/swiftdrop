import { InternalServerErrorException, Logger, UnprocessableEntityException } from '@nestjs/common';
import type { Database } from '@/database/database.module';
import type { OsrmService } from '@/integrations/osrm/services/osrm.service';
import type { ZonesService } from '@/modules/zones/services/zones.service';
import type { EstimatePriceDto } from '../dto/estimate-price.dto';
import { PRICING_ERROR_MESSAGES } from '../constants/pricing.constants';
import { PricingService } from './pricing.service';

const ZONE = { zoneId: 1, name: 'Минск', tariffId: 1 };
const TARIFF_ROW = { pricePerKm: '1.00', pricePerKg: '0.50', minPrice: '5.00', fragileFee: '2.00' };
const ROUTE = { distanceKm: 7.98, durationSec: 704.8 };

const DTO: EstimatePriceDto = {
  pickup: { latitude: 53.9006, longitude: 27.559 },
  delivery: { latitude: 53.9075, longitude: 27.457 },
  package: { weightKg: 2.5, lengthCm: 30, widthCm: 20, heightCm: 10, isFragile: false },
};

function buildDb(rows: unknown[]): Database {
  const chain = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(rows),
  };

  return chain as unknown as Database;
}

function setup(rows: unknown[] = [TARIFF_ROW]) {
  const findZonesForPoints = jest.fn().mockResolvedValue([ZONE, ZONE]);
  const getRoute = jest.fn().mockResolvedValue(ROUTE);
  const service = new PricingService(
    buildDb(rows),
    { findZonesForPoints } as unknown as ZonesService,
    { getRoute } as unknown as OsrmService,
  );

  return { service, findZonesForPoints, getRoute };
}

describe('PricingService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the estimate when both points are inside a zone', async () => {
    const { service } = setup();

    await expect(service.estimate(DTO)).resolves.toEqual({
      price: 9.23,
      currency: 'BYN',
      distanceKm: 7.98,
      estimatedMinutes: 22,
      coefficient: 1,
    });
  });

  it('should round the distance to two decimals before pricing', async () => {
    const { service, getRoute } = setup();
    getRoute.mockResolvedValue({ distanceKm: 7.98123, durationSec: 704.8 });

    const result = await service.estimate(DTO);

    expect(result.distanceKm).toBe(7.98);
  });

  it('should reject a package that no transport can carry without calling OSRM', async () => {
    const { service, getRoute } = setup();
    const heavy = { ...DTO, package: { ...DTO.package, weightKg: 600 } };

    await expect(service.estimate(heavy)).rejects.toThrow(PRICING_ERROR_MESSAGES.NO_VEHICLE);
    expect(getRoute).not.toHaveBeenCalled();
  });

  it('should reject a pickup point outside every zone without calling OSRM', async () => {
    const { service, findZonesForPoints, getRoute } = setup();
    findZonesForPoints.mockResolvedValue([null, ZONE]);

    await expect(service.estimate(DTO)).rejects.toThrow(PRICING_ERROR_MESSAGES.PICKUP_OUT_OF_ZONE);
    expect(getRoute).not.toHaveBeenCalled();
  });

  it('should reject a delivery point outside every zone', async () => {
    const { service, findZonesForPoints } = setup();
    findZonesForPoints.mockResolvedValue([ZONE, null]);

    await expect(service.estimate(DTO)).rejects.toThrow(
      PRICING_ERROR_MESSAGES.DELIVERY_OUT_OF_ZONE,
    );
  });

  it('should throw UnprocessableEntityException for a point outside every zone', async () => {
    const { service, findZonesForPoints } = setup();
    findZonesForPoints.mockResolvedValue([null, null]);

    await expect(service.estimate(DTO)).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('should throw InternalServerErrorException when the tariff of the zone is missing', async () => {
    const { service } = setup([]);

    await expect(service.estimate(DTO)).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
