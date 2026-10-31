import type { SortDirection } from '@/common/database/list-sort';
import type { VehicleType } from '@/common/enums/vehicle-type.enum';
import type { OrderCancelledBy } from '@/modules/orders/types/orders.types';
import type { AnalyticsCourierSortKey } from '../constants/manager-analytics.constants';

export type AnalyticsRange = {
  from: string;
  to: string;
  start: Date;
  end: Date;
};

export type AnalyticsPeriod = {
  current: AnalyticsRange;
  previous: AnalyticsRange;
  days: number;
};

export type AnalyticsKpiRow = {
  isCurrent: boolean;
  total: number;
  delivered: number;
  timed: number;
  onTime: number;
  avgDeliveryMin: number | null;
  cancelled: number;
  cancelledByClient: number;
  cancelledBySystem: number;
  cancelledByStaff: number;
  avgSearchMin: number | null;
  manual: number;
  revenue: string;
  paidOrders: number;
  avgCheck: string | null;
};

export type AnalyticsActivityRow = {
  day: string;
  hour: number;
  delivered: number;
  cancelled: number;
  inProgress: number;
};

export type AnalyticsKpiValues = {
  delivered: { delivered: number; total: number };
  onTime: { pct: number | null; count: number };
  avgDeliveryMin: number | null;
  cancelled: { pct: number | null; count: number; by: Record<OrderCancelledBy, number> };
  revenue: { total: string; avgCheck: string | null; orders: number };
  courierSearch: { avgMin: number | null; manual: number };
};

type Compared<T> = { current: T; previous: T };

export type AnalyticsKpis = { [K in keyof AnalyticsKpiValues]: Compared<AnalyticsKpiValues[K]> };

export type AnalyticsDay = {
  date: string;
  delivered: number;
  cancelled: number;
  inProgress: number;
};

export type AnalyticsHour = { hour: number; avgOrders: number };

export type AnalyticsSummary = {
  period: { from: string; to: string; previousFrom: string; previousTo: string };
  kpis: AnalyticsKpis;
  days: AnalyticsDay[];
  hours: AnalyticsHour[];
};

export type AnalyticsCourierSort = { key: AnalyticsCourierSortKey; direction: SortDirection };

export type AnalyticsCouriersQuery = {
  period: AnalyticsPeriod;
  sort: AnalyticsCourierSort;
  page: number;
  limit: number;
};

export type AnalyticsCourier = {
  courierId: number;
  name: string;
  vehicleType: VehicleType | null;
  delivered: number;
  onTimePct: number | null;
  avgDeliveryMin: number | null;
  declinedOffers: number;
  hoursOnline: number;
};

export type AnalyticsCouriersPage = {
  items: AnalyticsCourier[];
  total: number;
  page: number;
  limit: number;
  period: { from: string; to: string };
};
