import type { AnalyticsKpis } from '@/shared/analytics-api';

export type KpiCard = {
  id: keyof AnalyticsKpis;
  title: string;
  shortTitle: string;
  value: string;
  shortValue: string;
  note: string;
  shortNote: string;
};
