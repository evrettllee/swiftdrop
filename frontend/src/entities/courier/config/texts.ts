import { UI_TEXTS } from '@/shared/config';

export const COURIER_PROFILE_TEXTS = {
  LOAD_ERROR_TITLE: 'Не удалось загрузить данные курьера',
  LOAD_ERROR_HINT: 'Проверьте соединение и повторите попытку.',
  RETRY: UI_TEXTS.RETRY,
} as const;

// "Skoda Octavia, 1234 AB-7": the brand and the model, then the plate.
export const VEHICLE_NAME_SEPARATOR = ' ';
export const VEHICLE_DETAILS_SEPARATOR = ', ';
