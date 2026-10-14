import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, type SQL } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../../../common/constants/database.constants';
import { ORDER_OFFER_STATUS } from '../../../common/enums/order-offer-status.enum';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { orderOffers, orders, packages } from '../../../database/schema';
import { addressPointColumns, aliasOrderAddresses } from '../../orders/utils/order-address-columns';
import { toCourierOffer } from '../mappers/courier-offer.mapper';
import type { CourierOffer } from '../types/assignment.types';
import { parcelColumns } from '../utils/parcel-columns';

@Injectable()
export class OfferViewsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // The open offer of the courier, or null when there is none or its time is up.
  findCurrent(courierProfileId: number, now: Date = new Date()): Promise<CourierOffer | null> {
    return this.findOne(
      and(
        eq(orderOffers.courierId, courierProfileId),
        eq(orderOffers.status, ORDER_OFFER_STATUS.PENDING),
        gt(orderOffers.expiresAt, now),
      ),
    );
  }

  findById(offerId: number): Promise<CourierOffer | null> {
    return this.findOne(eq(orderOffers.offerId, offerId));
  }

  private async findOne(condition: SQL | undefined): Promise<CourierOffer | null> {
    const { pickup, delivery } = aliasOrderAddresses();
    const [row] = await this.db
      .select({
        offerId: orderOffers.offerId,
        orderId: orderOffers.orderId,
        expiresAt: orderOffers.expiresAt,
        pickupEtaSec: orderOffers.pickupEtaSec,
        totalEtaSec: orderOffers.totalEtaSec,
        pickup: addressPointColumns(pickup),
        delivery: {
          city: delivery.city,
          street: delivery.street,
          latitude: delivery.latitude,
          longitude: delivery.longitude,
        },
        parcel: parcelColumns(),
      })
      .from(orderOffers)
      .innerJoin(orders, eq(orders.orderId, orderOffers.orderId))
      .innerJoin(pickup, eq(pickup.addressId, orders.pickupAddressId))
      .innerJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
      .innerJoin(packages, eq(packages.orderId, orderOffers.orderId))
      .where(condition)
      .limit(SINGLE_ROW_LIMIT);

    return row ? toCourierOffer(row) : null;
  }
}
