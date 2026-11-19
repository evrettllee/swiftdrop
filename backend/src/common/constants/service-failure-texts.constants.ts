import type { ServiceName } from '@/common/enums/service-name.enum';
import type { ServiceFailureCode } from './service-failure-codes.constants';

export const SERVICE_LABELS: Record<ServiceName, string> = {
  osrm: 'Маршруты (OSRM)',
  nbrb: 'Курс НБ РБ',
  mail: 'Почта',
  stripe: 'Оплата (Stripe)',
  server: 'Сервер',
};

export const SERVICE_FAILURE_TEXTS: { [S in ServiceName]: Record<ServiceFailureCode<S>, string> } =
  {
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

export function failureText(service: ServiceName, code: string): string {
  const texts: Record<string, string> = SERVICE_FAILURE_TEXTS[service];

  return Object.hasOwn(texts, code) ? texts[code] : code;
}
