import { formatMinskShortDateTime } from '@/shared/lib/calendar';
import { formatWhole, pluralize } from '@/shared/lib/format';
import { FAILURE_FORMS, SERVICE_FORMS } from './texts';

export const SERVICE_TEXTS = {
  KPI_SERVER_ERRORS: 'Ошибки сервера',
  KPI_EXTERNAL_FAILURES: 'Сбои внешних сервисов',
  KPI_MAIL_FAILURES: 'Неотправленные письма',
  KPI_SAVED_RATE: 'Оплата по сохранённому курсу',
  MAIL_NONE: 'за период сбоев не было',
  SAVED_RATE_NOTE: 'НБ РБ был недоступен',
  ERRORS_TITLE: 'Ошибки сервера по дням',
  ERRORS_SUBTITLE: 'Ответы 5xx; подробности в логах backend',
  SERVICES_TITLE: 'Внешние сервисы',
  SERVICES_SUBTITLE: 'Сбои за период',
  SERVICE_OK: 'Без сбоев',
  SERVICE_NONE_SUBTITLE: 'за период без сбоев',
  RECENT_TITLE: 'Последние сбои',
  RECENT_SUBTITLE: 'Повторы одного сбоя за 10 минут объединены',
  RECENT_EMPTY: 'За период сбоев не зафиксировано',
  COL_TIME: 'Время',
  COL_SERVICE: 'Сервис',
  COL_REASON: 'Что случилось',
  COL_REPEATS: 'Повторов',
  lastMail: (iso: string): string => `последнее ${formatMinskShortDateTime(iso)}`,
  servicesCount: (count: number): string =>
    `${formatWhole(count)} ${pluralize(count, SERVICE_FORMS)}`,
  failuresCount: (count: number): string =>
    `${formatWhole(count)} ${pluralize(count, FAILURE_FORMS)}`,
} as const;
