import { eq, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Database } from '@/database/database.module';
import { courierProfiles, orders, packages, users } from '@/database/schema';
import { aliasOrderAddresses } from '@/modules/orders/utils/order-address-columns';
import type { ManagerExportRow } from '../types/manager-export.types';
import { paymentStateSql } from './manager-order-conditions';

const CLIENT_ALIAS = 'client_user';
const COURIER_ALIAS = 'courier_user';

const client = alias(users, CLIENT_ALIAS);
const courier = alias(users, COURIER_ALIAS);
const { pickup, delivery } = aliasOrderAddresses();

const CLIENT_NAME = { firstName: client.firstName, lastName: client.lastName };
const COURIER_NAME = { firstName: courier.firstName, lastName: courier.lastName };

export function managerExportQuery(
  db: Database,
  where: SQL | undefined,
  orderBy: SQL[],
  withPhones: boolean,
) {
  return db
    .select({
      orderId: orders.orderId,
      createdAt: orders.createdAt,
      status: orders.status,
      client: withPhones ? { ...CLIENT_NAME, phone: client.phone } : CLIENT_NAME,
      pickup: { street: pickup.street, house: pickup.house },
      delivery: { street: delivery.street, house: delivery.house },
      courier: withPhones ? { ...COURIER_NAME, phone: courier.phone } : COURIER_NAME,
      price: orders.price,
      paymentState: paymentStateSql(db),
      finishedAt: orders.finishedAt,
    })
    .from(orders)
    .innerJoin(packages, eq(packages.orderId, orders.orderId))
    .innerJoin(client, eq(client.userId, orders.clientId))
    .innerJoin(pickup, eq(pickup.addressId, orders.pickupAddressId))
    .innerJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
    .leftJoin(courierProfiles, eq(courierProfiles.courierProfileId, orders.courierId))
    .leftJoin(courier, eq(courier.userId, courierProfiles.userId))
    .where(where)
    .orderBy(...orderBy);
}

export async function findManagerExportRows(
  db: Database,
  where: SQL | undefined,
  orderBy: SQL[],
  withPhones: boolean,
): Promise<ManagerExportRow[]> {
  return managerExportQuery(db, where, orderBy, withPhones);
}
