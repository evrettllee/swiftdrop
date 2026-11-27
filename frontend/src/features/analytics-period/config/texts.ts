export const PERIOD_TEXTS = {
  LABEL: 'Период',
  WEEK: '7 дней',
  MONTH: '30 дней',
  QUARTER: '90 дней',
  CUSTOM: 'Свой период',
  FROM: 'С',
  TO: 'По',
  REQUIRED: 'Укажите обе даты периода',
  REVERSED: 'Начало периода позже его конца',
  TOO_LONG: 'Период: не больше 92 дней',
  comparisonLine: (current: string, previous: string): string =>
    `${current}, сравнение с ${previous}`,
} as const;
