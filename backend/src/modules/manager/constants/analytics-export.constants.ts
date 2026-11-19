import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import type { UserThrottleOptions } from '@/common/guards/user-throttle.guard';

export const ANALYTICS_EXPORT_ROUTE = 'export';

export const EXPORT_SECTION = {
  SUMMARY: 'summary',
  DAYS: 'days',
  HOURS: 'hours',
  ZONES: 'zones',
  COURIERS: 'couriers',
  FAILURES: 'failures',
} as const;

export type ExportSection = (typeof EXPORT_SECTION)[keyof typeof EXPORT_SECTION];

export const ADMIN_EXPORT_SECTIONS = [
  EXPORT_SECTION.SUMMARY,
  EXPORT_SECTION.DAYS,
  EXPORT_SECTION.ZONES,
  EXPORT_SECTION.COURIERS,
  EXPORT_SECTION.FAILURES,
] as const satisfies readonly ExportSection[];

export const MANAGER_EXPORT_SECTIONS = [
  EXPORT_SECTION.SUMMARY,
  EXPORT_SECTION.DAYS,
  EXPORT_SECTION.HOURS,
  EXPORT_SECTION.ZONES,
  EXPORT_SECTION.COURIERS,
] as const satisfies readonly ExportSection[];

export const EXPORT_SHEET_NAMES: Record<ExportSection, string> = {
  summary: 'Сводка',
  days: 'По дням',
  hours: 'По часам',
  zones: 'По зонам',
  couriers: 'Курьеры',
  failures: 'Сбои',
};

export const SECTIONS_SEPARATOR = ',';

export const ANALYTICS_EXPORT_ROW_LIMIT = 5000;

export const ANALYTICS_EXPORT_FILE_PREFIX = {
  ADMIN: 'swiftdrop-analytics',
  MANAGER: 'swiftdrop-manager-analytics',
} as const;

export const ANALYTICS_EXPORT_MESSAGES = {
  NO_SECTION: 'Выберите хотя бы один раздел',
  UNKNOWN_SECTION: 'Неизвестный раздел',
  CSV_ONE_TABLE: 'Для CSV выберите одну таблицу',
  CSV_NO_SUMMARY: 'Сводка выгружается только в Excel',
  TOO_MANY: 'Слишком много выгрузок. Подождите минуту',
} as const;

export const ANALYTICS_EXPORT_THROTTLE: UserThrottleOptions = {
  key: 'analytics-export',
  limit: 10,
  ttlMs: MS_PER_MINUTE,
  message: ANALYTICS_EXPORT_MESSAGES.TOO_MANY,
};
