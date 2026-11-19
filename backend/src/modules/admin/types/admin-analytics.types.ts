import type { DeliveryZoneRow } from '@/common/types/delivery-zone.types';
import type { ExternalService } from '@/common/constants/service-failure-codes.constants';
import type { ServiceName } from '@/common/enums/service-name.enum';
import type { TicketTopic } from '@/common/enums/support-ticket.enum';

export type Compared<T> = { value: T; previous: T };

export type AnalyticsPeriodDates = { from: string; to: string };

export type BusinessAnalytics = {
  period: AnalyticsPeriodDates;
  kpis: {
    ordersCreated: Compared<number>;
    revenue: Compared<number>;
    averageCheck: Compared<number | null>;
    refunds: Compared<{ amount: number; orders: number }>;
  };
  funnel: { created: number; paid: number; courierAssigned: number; delivered: number };
  losses: {
    unpaidExpired: number;
    cancelledBeforePayment: number;
    cancelledAfterPayment: { client: number; system: number; staff: number };
    inProgress: number;
  };
  revenueByDay: { date: string; revenue: number; delivered: number }[];
};

export type DeliveryAnalytics = {
  period: AnalyticsPeriodDates;
  kpis: {
    onTimeRate: Compared<{ onTime: number; total: number }>;
    averageDeliveryMinutes: Compared<number | null>;
    autoAssignedRate: Compared<{ auto: number; manual: number }>;
    averageSearchSeconds: Compared<number | null>;
  };
  onTimeByDay: { date: string; onTime: number; total: number }[];
  offers: {
    accepted: number;
    declined: number;
    expired: number;
    total: number;
    orders: number;
    maxDeclinesBeforeManual: number;
  };
  zones: DeliveryZoneRow[];
};

export type UsersAnalytics = {
  period: AnalyticsPeriodDates;
  kpis: {
    newClients: Compared<number>;
    activeClients: Compared<number>;
    repeatClients: Compared<{ repeat: number; active: number }>;
    couriersOnline: { onShift: number; total: number };
    averageDeliveriesPerCourier: Compared<number | null>;
  };
  newClientsByDay: { date: string; count: number }[];
  ordersPerClient: { one: number; two: number; threeToFive: number; sixPlus: number };
};

export type SupportAnalytics = {
  period: AnalyticsPeriodDates;
  kpis: {
    ticketsCreated: Compared<number>;
    firstResponseMedianMinutes: Compared<number | null>;
    closed: Compared<{ closed: number; total: number }>;
    unansweredNow: { count: number; longestWaitMinutes: number | null };
  };
  topics: { topic: TicketTopic; count: number }[];
  firstResponseByDay: { date: string; medianMinutes: number | null; tickets: number }[];
};

export type ExternalServiceRow = {
  service: ExternalService;
  failures: number;
  lastAt: string | null;
  lastCode: string | null;
};

export type RecentFailure = {
  lastAt: string;
  firstAt: string;
  service: ServiceName;
  code: string;
  message: string;
  repeats: number;
};

export type ServiceAnalytics = {
  period: AnalyticsPeriodDates;
  kpis: {
    serverErrors: Compared<number>;
    externalFailures: Compared<{ failures: number; services: number }>;
    mailFailures: { count: number; lastAt: string | null };
    savedRateUsed: number;
  };
  serverErrorsByDay: { date: string; count: number }[];
  services: ExternalServiceRow[];
  recent: RecentFailure[];
};
