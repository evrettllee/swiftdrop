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

export type DeliveryZoneRow = {
  zoneId: number | null;
  name: string;
  orders: number;
  onTime: number;
  onTimeTotal: number;
  averageDeliveryMinutes: number | null;
  manualAssigned: number;
  revenue: number;
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
