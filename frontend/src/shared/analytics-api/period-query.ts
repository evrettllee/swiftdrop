import { z } from 'zod';

export const ANALYTICS_MAX_DAYS = 92;

export type AnalyticsPeriodQuery = {
  from: string;
  to: string;
};

export const analyticsPeriodDatesSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export function comparedSchema<T extends z.ZodTypeAny>(schema: T) {
  return z.object({
    value: schema,
    previous: schema,
  });
}

export function buildPeriodSearchParams(period: AnalyticsPeriodQuery): URLSearchParams {
  return new URLSearchParams({
    from: period.from,
    to: period.to,
  });
}
