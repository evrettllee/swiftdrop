import { MS_PER_SECOND } from '@/shared/config';

// No position of the courier came for this long: the page shows that the connection with the
// courier is lost. Counted by the clock of the page from when a position came, so the clocks of the
// page and of the backend need not agree (COURIER_LOCATION_STALE_MS of the backend is the same).
export const COURIER_POSITION_STALE_MS = 60 * MS_PER_SECOND;

// A failed request for the courier is repeated after this, as the lines of a map are.
export const ORDER_COURIER_RETRY_MS = 10 * MS_PER_SECOND;
// An order that no longer changes (a delivered one) repeats a failed request this many times.
export const ORDER_COURIER_RETRIES_WHEN_FINISHED = 1;

// The courier of the order and the code for them.
export const ORDER_COURIER_TEXTS = {
  SECTION: 'Курьер',
  SEARCHING: 'Ищем курьера рядом с точкой забора',
  // The type of the transport and its details are one line: "Легковой, Skoda Octavia, 1234 AB-7".
  VEHICLE_SEPARATOR: ', ',
  CALL: 'Позвонить курьеру',
  CHAT: 'Чат с курьером',
  chatUnread: (count: number) => `Чат с курьером, непрочитанных сообщений: ${count}`,
  markerMinutes: (minutes: number) => `${minutes} мин`,
  MARKER_OFFLINE: 'нет связи',
  CODE_SECTION: 'Код для курьера',
  CODE_HINT: 'Курьер спросит код при вручении. Не называйте его заранее.',
  // For example "Код 4 8 2 7": the digits are read one by one.
  codeLabel: (digits: string) => `Код ${Array.from(digits).join(' ')}`,
} as const;
