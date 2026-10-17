import { MS_PER_SECOND } from '@/shared/config';

// How often the page of an active order asks the backend again: the client has no socket.
export const ORDER_POLL_INTERVAL_MS = 10 * MS_PER_SECOND;

// The courier of the order and the code for them.
export const ORDER_COURIER_TEXTS = {
  SECTION: 'Курьер',
  SEARCHING: 'Ищем курьера рядом с точкой забора',
  // The type of the transport and its details are one line: "Легковой, Skoda Octavia, 1234 AB-7".
  VEHICLE_SEPARATOR: ', ',
  CODE_SECTION: 'Код для курьера',
  CODE_HINT: 'Курьер спросит код при вручении. Не называйте его заранее.',
  // For example "Код 4 8 2 7": the digits are read one by one.
  codeLabel: (digits: string) => `Код ${Array.from(digits).join(' ')}`,
} as const;
