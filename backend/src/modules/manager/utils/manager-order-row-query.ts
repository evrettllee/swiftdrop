import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import type { Database } from '@/database/database.module';
import { courierProfiles, orders, packages, tariffs, users, vehicles } from '@/database/schema';
import {
  addressPointColumns,
  aliasOrderAddresses,
} from '@/modules/orders/utils/order-address-columns';

const CLIENT_ALIAS = 'client_user';
const COURIER_ALIAS = 'courier_user';

const client = alias(users, CLIENT_ALIAS);
const courier = alias(users, COURIER_ALIAS);
const { pickup, delivery } = aliasOrderAddresses();

const ORDER_DETAILS_COLUMNS = {
  orderId: orders.orderId,
  status: orders.status,
  createdAt: orders.createdAt,
  statusChangedAt: orders.statusChangedAt,
  finishedAt: orders.finishedAt,
  client: {
    id: client.userId,
    firstName: client.firstName,
    lastName: client.lastName,
    phone: client.phone,
    email: client.email,
  },
  courierId: orders.courierId,
  courier: { firstName: courier.firstName, lastName: courier.lastName, phone: courier.phone },
  vehicle: {
    type: vehicles.type,
    brand: vehicles.brand,
    model: vehicles.model,
    plate: vehicles.licensePlate,
  },
  recipient: { name: orders.recipientName, phone: orders.recipientPhone },
  pickup: addressPointColumns(pickup),
  delivery: addressPointColumns(delivery),
  parcel: {
    weight: packages.weight,
    length: packages.length,
    width: packages.width,
    height: packages.height,
    fragile: packages.isFragile,
  },
  price: orders.price,
  coefficient: orders.priceCoefficient,
  distanceKm: orders.distanceKm,
  estimatedMinutes: orders.estimatedMinutes,
  tariffName: tariffs.name,
};

export async function findOrderRow(db: Database, orderId: number) {
  const [row] = await db
    .select(ORDER_DETAILS_COLUMNS)
    .from(orders)
    .innerJoin(client, eq(client.userId, orders.clientId))
    .innerJoin(pickup, eq(pickup.addressId, orders.pickupAddressId))
    .innerJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
    .innerJoin(packages, eq(packages.orderId, orders.orderId))
    .innerJoin(tariffs, eq(tariffs.tariffId, orders.tariffId))
    .leftJoin(courierProfiles, eq(courierProfiles.courierProfileId, orders.courierId))
    .leftJoin(courier, eq(courier.userId, courierProfiles.userId))
    .leftJoin(vehicles, eq(vehicles.courierProfileId, courierProfiles.courierProfileId))
    .where(eq(orders.orderId, orderId))
    .limit(SINGLE_ROW_LIMIT);

  return row;
}

export type OrderDetailsRow = NonNullable<Awaited<ReturnType<typeof findOrderRow>>>;
