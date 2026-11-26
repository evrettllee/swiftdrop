import { z } from 'zod';
import { TICKET_TOPIC } from '@/shared/staff-api';
import { analyticsPeriodDatesSchema, comparedSchema } from './period-query';

export const EXTERNAL_SERVICES = ['osrm', 'nbrb', 'mail', 'stripe'] as const;
export const SERVICE_NAMES = [...EXTERNAL_SERVICES, 'server'] as const;

export type ExternalService = (typeof EXTERNAL_SERVICES)[number];
export type ServiceName = (typeof SERVICE_NAMES)[number];

const externalServiceSchema = z.enum(EXTERNAL_SERVICES);
const serviceNameSchema = z.enum(SERVICE_NAMES);
const ticketTopicSchema = z.enum([
  TICKET_TOPIC.ORDER_PROBLEM,
  TICKET_TOPIC.PAYMENT,
  TICKET_TOPIC.ACCOUNT,
  TICKET_TOPIC.CLIENT_UNREACHABLE,
  TICKET_TOPIC.APP,
  TICKET_TOPIC.OTHER,
]);

export const usersAnalyticsSchema = z.object({
  period: analyticsPeriodDatesSchema,
  kpis: z.object({
    newClients: comparedSchema(z.number()),
    activeClients: comparedSchema(z.number()),
    repeatClients: comparedSchema(z.object({ repeat: z.number(), active: z.number() })),
    couriersOnline: z.object({ onShift: z.number(), total: z.number() }),
    averageDeliveriesPerCourier: comparedSchema(z.number().nullable()),
  }),
  newClientsByDay: z.array(z.object({ date: z.string(), count: z.number() })),
  ordersPerClient: z.object({
    one: z.number(),
    two: z.number(),
    threeToFive: z.number(),
    sixPlus: z.number(),
  }),
});

export const supportAnalyticsSchema = z.object({
  period: analyticsPeriodDatesSchema,
  kpis: z.object({
    ticketsCreated: comparedSchema(z.number()),
    firstResponseMedianMinutes: comparedSchema(z.number().nullable()),
    closed: comparedSchema(z.object({ closed: z.number(), total: z.number() })),
    unansweredNow: z.object({ count: z.number(), longestWaitMinutes: z.number().nullable() }),
  }),
  topics: z.array(z.object({ topic: ticketTopicSchema, count: z.number() })),
  firstResponseByDay: z.array(
    z.object({
      date: z.string(),
      medianMinutes: z.number().nullable(),
      tickets: z.number(),
    }),
  ),
});

export const serviceAnalyticsSchema = z.object({
  period: analyticsPeriodDatesSchema,
  kpis: z.object({
    serverErrors: comparedSchema(z.number()),
    externalFailures: comparedSchema(z.object({ failures: z.number(), services: z.number() })),
    mailFailures: z.object({ count: z.number(), lastAt: z.string().nullable() }),
    savedRateUsed: z.number(),
  }),
  serverErrorsByDay: z.array(z.object({ date: z.string(), count: z.number() })),
  services: z.array(
    z.object({
      service: externalServiceSchema,
      failures: z.number(),
      lastAt: z.string().nullable(),
      lastCode: z.string().nullable(),
    }),
  ),
  recent: z.array(
    z.object({
      lastAt: z.string(),
      firstAt: z.string(),
      service: serviceNameSchema,
      code: z.string(),
      message: z.string(),
      repeats: z.number(),
    }),
  ),
});

export type UsersAnalytics = z.infer<typeof usersAnalyticsSchema>;
export type SupportAnalytics = z.infer<typeof supportAnalyticsSchema>;
export type ServiceAnalytics = z.infer<typeof serviceAnalyticsSchema>;
