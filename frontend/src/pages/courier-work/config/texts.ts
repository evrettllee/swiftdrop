import { UI_TEXTS } from '@/shared/config';

export const COURIER_WORK_TEXTS = {
  PAGE_TITLE: UI_TEXTS.COURIER_WORK,
} as const;

// The alert above the page while the cabinet has no connection.
export const CONNECTION_ALERT_TEXTS = {
  RECONNECTING_TITLE: 'Нет связи, переподключаемся',
  OFFLINE_TITLE: 'Нет связи с сервером',
  RECONNECTING_HINT: 'Пока связи нет, заказы не приходят.',
  OFFLINE_HINT: 'Заказы не приходят. Обновите страницу, чтобы подключиться снова.',
} as const;
