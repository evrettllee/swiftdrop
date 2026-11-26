import {
  ADMIN_EXPORT_SECTIONS,
  ANALYTICS_EXPORT_ROLE,
  ANALYTICS_EXPORT_SECTION,
  type AnalyticsExportRole,
  type AnalyticsExportSection,
  MANAGER_EXPORT_SECTIONS,
} from '@/shared/analytics-api';

export const ANALYTICS_EXPORT_TEXTS = {
  BUTTON: 'Выгрузить',
  TITLE: 'Выгрузить отчёт',
  PERIOD: 'Период',
  FORMAT_LEGEND: 'Формат',
  FORMAT_XLSX: 'Excel (XLSX)',
  FORMAT_XLSX_DESCRIPTION: 'Каждый раздел на отдельном листе',
  FORMAT_CSV: 'CSV',
  FORMAT_CSV_DESCRIPTION: 'Одна таблица на выбор',
  SECTIONS_LEGEND: 'Что выгрузить',
  DEFAULT_ALL_HINT: 'По умолчанию выгружается всё',
  NO_SECTION_HINT: 'Выберите хотя бы один раздел',
  CANCEL: 'Отмена',
  SUBMIT: 'Выгрузить',
  ERROR_FALLBACK: 'Не удалось выгрузить отчёт',
  TOO_MANY: 'Слишком много выгрузок. Подождите минуту',
} as const;

export const EXPORT_SECTION_LABELS: Record<AnalyticsExportSection, string> = {
  [ANALYTICS_EXPORT_SECTION.SUMMARY]: 'Сводка',
  [ANALYTICS_EXPORT_SECTION.DAYS]: 'По дням',
  [ANALYTICS_EXPORT_SECTION.HOURS]: 'По часам',
  [ANALYTICS_EXPORT_SECTION.ZONES]: 'По зонам',
  [ANALYTICS_EXPORT_SECTION.COURIERS]: 'Курьеры',
  [ANALYTICS_EXPORT_SECTION.FAILURES]: 'Сбои',
};

export const ROLE_EXPORT_SECTIONS: Record<AnalyticsExportRole, readonly AnalyticsExportSection[]> =
  {
    [ANALYTICS_EXPORT_ROLE.ADMIN]: ADMIN_EXPORT_SECTIONS,
    [ANALYTICS_EXPORT_ROLE.MANAGER]: MANAGER_EXPORT_SECTIONS,
  };

export const DEFAULT_CSV_SECTION = ANALYTICS_EXPORT_SECTION.DAYS;
