import type { ServiceName } from '@/shared/analytics-api';

export const ADMIN_SERVICE_LABELS: Record<ServiceName, string> = {
  osrm: 'Маршруты (OSRM)',
  nbrb: 'Курс НБ РБ',
  mail: 'Почта',
  stripe: 'Оплата (Stripe)',
  server: 'Сервер',
};

const FAILURE_TEXTS_BY_SERVICE: Record<ServiceName, Record<string, string>> = {
  osrm: {
    timeout: 'Сервис маршрутов не ответил вовремя',
    unavailable: 'Сервис маршрутов недоступен',
    bad_response: 'Сервис маршрутов вернул неверный ответ',
  },
  nbrb: {
    timeout: 'НБ РБ не ответил вовремя',
    unavailable: 'Курс НБ РБ недоступен',
    bad_response: 'НБ РБ вернул неверный ответ',
    saved_rate_used: 'Оплата по сохранённому курсу',
  },
  mail: {
    send_failed: 'Письмо не отправлено',
    timeout: 'Почтовый сервер не ответил вовремя',
  },
  stripe: {
    webhook_bad_signature: 'Уведомление об оплате с неверной подписью',
    api_error: 'Ошибка запроса к Stripe',
    timeout: 'Stripe не ответил вовремя',
  },
  server: {
    internal_error: 'Внутренняя ошибка сервера',
  },
};

export function adminFailureText(service: ServiceName, code: string): string {
  const texts = FAILURE_TEXTS_BY_SERVICE[service];

  return Object.hasOwn(texts, code) ? texts[code] : code;
}
