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

// The panel of the line.
export const LINE_TEXTS = {
  OFFLINE_TITLE: 'Вы не на линии',
  OFFLINE_HINT: 'Выйдите на линию, чтобы получать заказы рядом.',
  GO_ONLINE: 'Выйти на линию',
  ONLINE_TITLE: 'Вы на линии',
  ONLINE_HINT: 'Ищем заказы рядом. Не закрывайте вкладку.',
  GO_OFFLINE: 'Уйти с линии',
  CHANGE_VEHICLE: 'Изменить',
  ACTIVE_ORDER_TITLE: 'У вас активный заказ',
  ACTIVE_ORDER_HINT: 'Скоро здесь появится экран текущего заказа.',
} as const;

// The alert when the browser gives no position, so the courier cannot go on the line.
export const GEO_ALERT_TEXTS = {
  DENIED_TITLE: 'Нет доступа к геопозиции',
  DENIED_HINT: 'Разрешите доступ к местоположению в настройках браузера.',
  FAILED_TITLE: 'Не удалось определить местоположение',
  FAILED_HINT: 'Проверьте, что геопозиция включена на устройстве, и попробуйте ещё раз.',
  RETRY: 'Проверить ещё раз',
} as const;

// The results of the day.
export const TODAY_TEXTS = {
  TITLE: 'Сегодня',
  DELIVERED: 'Доставлено',
  DISTANCE: 'Пройдено',
  OFFERS: 'Принято предложений',
  RATING: 'Рейтинг',
  // A value that does not exist yet, for example the rating before the first review.
  NO_VALUE: '—',
  LOAD_ERROR: 'Не удалось загрузить итоги дня',
  RETRY: UI_TEXTS.RETRY,
  offers: (accepted: string, received: string) => `${accepted} из ${received}`,
} as const;
