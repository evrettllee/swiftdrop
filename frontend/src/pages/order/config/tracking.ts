import { MS_PER_SECOND } from '@/shared/config';

// A failed request for the courier is repeated after this, as the lines of a map are.
export const ORDER_COURIER_RETRY_MS = 10 * MS_PER_SECOND;
// An order that no longer changes (a delivered one) repeats a failed request this many times.
export const ORDER_COURIER_RETRIES_WHEN_FINISHED = 1;

// The courier of the order and the code for them.
export const ORDER_COURIER_TEXTS = {
  CHANGED: 'Назначен новый курьер',
  CHANGED_IN_CHAT: 'Курьер сменился',
  SECTION: 'Курьер',
  SEARCHING: 'Ищем курьера рядом с точкой забора',
  VEHICLE_SEPARATOR: ', ',
  CALL: 'Позвонить курьеру',
  CHAT: 'Чат с курьером',
  chatUnread: (count: number) => `Непрочитанных сообщений: ${count}`,
  chatWith: (name: string) => `Чат с курьером ${name}`,
  MESSAGE_LABEL: 'Сообщение курьеру',
  COURIER_ROLE: 'Курьер',
  QUICK_REPLIES: ['Сейчас выйду', 'Подождите 5 минут', 'Позвоните, пожалуйста'],
  markerMinutes: (minutes: number) => `${minutes} мин`,
  MARKER_OFFLINE: 'нет связи',
  CODE_SECTION: 'Код для курьера',
  CODE_HINT: 'Курьер спросит код при вручении. Не называйте его заранее.',
  // For example "Код 4 8 2 7": the digits are read one by one.
  codeLabel: (digits: string) => `Код ${Array.from(digits).join(' ')}`,
} as const;
