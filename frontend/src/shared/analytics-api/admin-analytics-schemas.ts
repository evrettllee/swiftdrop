import { z } from 'zod';
import { analyticsPeriodDatesSchema, comparedSchema } from './period-query';

export const deliveryZoneRowSchema = z.object({
  zoneId: z.number().nullable(),
  name: z.string(),
  orders: z.number(),
  onTime: z.number(),
  onTimeTotal: z.number(),
  averageDeliveryMinutes: z.number().nullable(),
  manualAssigned: z.number(),
  revenue: z.number(),
});

export const businessAnalyticsSchema = z.object({
  period: analyticsPeriodDatesSchema,
  kpis: z.object({
    ordersCreated: comparedSchema(z.number()),
    revenue: comparedSchema(z.number()),
    averageCheck: comparedSchema(z.number().nullable()),
    refunds: comparedSchema(z.object({ amount: z.number(), orders: z.number() })),
  }),
  funnel: z.object({
    created: z.number(),
    paid: z.number(),
    courierAssigned: z.number(),
    delivered: z.number(),
  }),
  losses: z.object({
    unpaidExpired: z.number(),
    cancelledBeforePayment: z.number(),
    cancelledAfterPayment: z.object({
      client: z.number(),
      system: z.number(),
      staff: z.number(),
    }),
    inProgress: z.number(),
  }),
  revenueByDay: z.array(
    z.object({
      date: z.string(),
      revenue: z.number(),
      delivered: z.number(),
    }),
  ),
});

export const deliveryAnalyticsSchema = z.object({
  period: analyticsPeriodDatesSchema,
  kpis: z.object({
    onTimeRate: comparedSchema(z.object({ onTime: z.number(), total: z.number() })),
    averageDeliveryMinutes: comparedSchema(z.number().nullable()),
    autoAssignedRate: comparedSchema(z.object({ auto: z.number(), manual: z.number() })),
    averageSearchSeconds: comparedSchema(z.number().nullable()),
  }),
  onTimeByDay: z.array(
    z.object({
      date: z.string(),
      onTime: z.number(),
      total: z.number(),
    }),
  ),
  offers: z.object({
    accepted: z.number(),
    declined: z.number(),
    expired: z.number(),
    total: z.number(),
    orders: z.number(),
    maxDeclinesBeforeManual: z.number(),
  }),
  zones: z.array(deliveryZoneRowSchema),
});

export type DeliveryZoneRow = z.infer<typeof deliveryZoneRowSchema>;
export type BusinessAnalytics = z.infer<typeof businessAnalyticsSchema>;
export type DeliveryAnalytics = z.infer<typeof deliveryAnalyticsSchema>;
