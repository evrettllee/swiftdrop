import { z } from 'zod';
import { http } from '../http';

export const MANAGER_ORDERS_API_PATHS = {
  ORDERS: '/manager/orders',
  COUNTS: '/manager/orders/counts',
} as const;

export const managerOrderCountsSchema = z.object({
  attention: z.number(),
  active: z.number(),
  awaitingPayment: z.number(),
  finished: z.number(),
  cancelled: z.number(),
  all: z.number(),
});

export type ManagerOrderCounts = z.infer<typeof managerOrderCountsSchema>;

export async function getManagerOrderCounts(signal?: AbortSignal): Promise<ManagerOrderCounts> {
  return managerOrderCountsSchema.parse(
    await http.get(MANAGER_ORDERS_API_PATHS.COUNTS, { signal }),
  );
}
