import { z } from 'zod';
import { ApiError, HTTP_STATUS, type HttpOptions, http, VEHICLE_TYPE } from '@/shared/api';

export const MANAGER_ANALYTICS_API_PATHS = {
  SUMMARY: '/manager/analytics/summary',
  COURIERS: '/manager/analytics/couriers',
} as const;

export const ANALYTICS_MAX_DAYS = 92;
export const ANALYTICS_COURIERS_LIMIT = 20;

export const ANALYTICS_COURIER_SORT_KEY = {
  DELIVERED: 'delivered',
  ON_TIME: 'onTimePct',
  AVG_DELIVERY: 'avgDeliveryMin',
  DECLINED: 'declinedOffers',
  HOURS_ONLINE: 'hoursOnline',
  NAME: 'name',
} as const;

export type AnalyticsCourierSortKey =
  (typeof ANALYTICS_COURIER_SORT_KEY)[keyof typeof ANALYTICS_COURIER_SORT_KEY];

export const ANALYTICS_SORT_DIRECTION = { ASC: 'asc', DESC: 'desc' } as const;

export type AnalyticsSortDirection =
  (typeof ANALYTICS_SORT_DIRECTION)[keyof typeof ANALYTICS_SORT_DIRECTION];

export type AnalyticsCourierSort = `${AnalyticsCourierSortKey}:${AnalyticsSortDirection}`;

export const ANALYTICS_COURIER_SORTS = Object.values(ANALYTICS_COURIER_SORT_KEY).flatMap((key) =>
  Object.values(ANALYTICS_SORT_DIRECTION).map(
    (direction): AnalyticsCourierSort => `${key}:${direction}`,
  ),
);

export const ANALYTICS_DEFAULT_COURIER_SORT: AnalyticsCourierSort = 'delivered:desc';

function compared<T extends z.ZodType>(schema: T) {
  return z.object({ current: schema, previous: schema });
}

const kpisSchema = z.object({
  delivered: compared(z.object({ delivered: z.number(), total: z.number() })),
  onTime: compared(z.object({ pct: z.number().nullable(), count: z.number() })),
  avgDeliveryMin: compared(z.number().nullable()),
  cancelled: compared(
    z.object({
      pct: z.number().nullable(),
      count: z.number(),
      by: z.object({ client: z.number(), system: z.number(), staff: z.number() }),
    }),
  ),
  revenue: compared(
    z.object({ total: z.string(), avgCheck: z.string().nullable(), orders: z.number() }),
  ),
  courierSearch: compared(z.object({ avgMin: z.number().nullable(), manual: z.number() })),
});

export const analyticsSummarySchema = z.object({
  period: z.object({
    from: z.string(),
    to: z.string(),
    previousFrom: z.string(),
    previousTo: z.string(),
  }),
  kpis: kpisSchema,
  days: z.array(
    z.object({
      date: z.string(),
      delivered: z.number(),
      cancelled: z.number(),
      inProgress: z.number(),
    }),
  ),
  hours: z.array(z.object({ hour: z.number(), avgOrders: z.number() })),
});

export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>;
export type AnalyticsKpis = AnalyticsSummary['kpis'];
export type AnalyticsDay = AnalyticsSummary['days'][number];
export type AnalyticsHour = AnalyticsSummary['hours'][number];

export const analyticsCourierSchema = z.object({
  courierId: z.number(),
  name: z.string(),
  vehicleType: z.enum(VEHICLE_TYPE).nullable(),
  delivered: z.number(),
  onTimePct: z.number().nullable(),
  avgDeliveryMin: z.number().nullable(),
  declinedOffers: z.number(),
  hoursOnline: z.number(),
});

export type AnalyticsCourier = z.infer<typeof analyticsCourierSchema>;

const analyticsCouriersSchema = z.object({
  items: z.array(analyticsCourierSchema),
  total: z.number(),
  period: z.object({ from: z.string(), to: z.string() }),
});

export type AnalyticsCouriersPage = z.infer<typeof analyticsCouriersSchema>;

export type AnalyticsPeriodQuery = { from: string; to: string };

export type AnalyticsCouriersQuery = AnalyticsPeriodQuery & {
  sort: AnalyticsCourierSort;
  page: number;
  limit: number;
};

export async function getAnalyticsSummary(
  query: AnalyticsPeriodQuery,
  options: HttpOptions = {},
): Promise<AnalyticsSummary> {
  const search = new URLSearchParams(query);

  return analyticsSummarySchema.parse(
    await http.get(`${MANAGER_ANALYTICS_API_PATHS.SUMMARY}?${search.toString()}`, options),
  );
}

export async function getAnalyticsCouriers(
  query: AnalyticsCouriersQuery,
  options: HttpOptions = {},
): Promise<AnalyticsCouriersPage> {
  const search = new URLSearchParams({
    from: query.from,
    to: query.to,
    sort: query.sort,
    page: String(query.page),
    limit: String(query.limit),
  });

  return analyticsCouriersSchema.parse(
    await http.get(`${MANAGER_ANALYTICS_API_PATHS.COURIERS}?${search.toString()}`, options),
  );
}

export function isTooManyRequests(error: unknown): boolean {
  return error instanceof ApiError && error.status === HTTP_STATUS.TOO_MANY_REQUESTS;
}
