import { HTTP_STATUS } from '@/shared/api';

// The backend explains a 422 itself (out of the zone, too heavy), so only two statuses are replaced:
// 429 comes from the throttler without a Russian text, 503 means the routing service is down.
export const ESTIMATE_STATUS_MESSAGES: Record<number, string> = {
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Слишком много расчётов подряд. Подождите минуту и повторите',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Не удалось построить маршрут. Попробуйте ещё раз чуть позже',
};

// What the price block says while there is no price yet: on the landing and on the order form.
export const ESTIMATE_TEXTS = {
  NEEDS_ADDRESSES: 'Укажите оба адреса, и мы покажем стоимость',
  NEEDS_PACKAGE: 'Проверьте вес и размеры посылки',
  LOADING: 'Считаем стоимость',
} as const;
