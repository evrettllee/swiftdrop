import type {
  BusinessAnalytics,
  DeliveryAnalytics,
  ServiceAnalytics,
  SupportAnalytics,
  UsersAnalytics,
} from './admin-analytics.types';

export type AdminExportDay = {
  date: string;
  ordersCreated: number;
  delivered: number;
  revenue: number;
  onTime: number;
  onTimeTotal: number;
  newClients: number;
  tickets: number;
  serverErrors: number;
};

export type AdminExportPeriod = {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
};

export type AdminSummaryInput = {
  period: AdminExportPeriod;
  business: BusinessAnalytics;
  delivery: DeliveryAnalytics;
  users: UsersAnalytics;
  support: SupportAnalytics;
  service: ServiceAnalytics;
};
