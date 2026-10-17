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
} as const;

// The stages of the order the courier carries: the title of the screen and the main button.
export const ORDER_STEP_TEXTS = {
  TO_PICKUP: 'Едете к точке забора',
  PICK_UP: 'Забрал посылку',
  PICKED_UP: 'Посылка у вас',
  DEPART: 'Еду к получателю',
  TO_RECIPIENT: 'Едете к получателю',
  ENTER_CODE: 'Ввести код',
  CODE_HINT: 'Код доставки спросите у получателя',
  step: (number: number, total: number) => `Этап ${number} из ${total}`,
} as const;

// The screen of the order the courier carries.
export const ORDER_TEXTS = {
  PICKUP: 'Забрать',
  DELIVERY_NEXT: 'Потом доставить',
  DELIVERY: 'Доставить',
  ADDRESS: 'Адрес',
  SENDER: 'Отправитель',
  RECIPIENT: 'Получатель',
  PHONE: 'Телефон',
  ROUTE: 'Маршрут',
  CALL: 'Позвонить',
  CALL_SENDER: 'Позвонить отправителю',
  CALL_RECIPIENT: 'Позвонить получателю',
  PARCEL: 'Посылка',
  DISTANCE: 'Расстояние',
  LOAD_ERROR: 'Не удалось загрузить заказ',
  RETRY: UI_TEXTS.RETRY,
  orderNumber: (number: string) => `Заказ ${number}`,
} as const;

// The screen where the courier enters the code of the recipient.
export const DELIVERY_CODE_TEXTS = {
  BACK: 'К заказу',
  TITLE: 'Код доставки',
  HINT: 'Попросите у получателя 4 цифры.',
  LABEL: 'Код из заказа',
  SUBMIT: 'Подтвердить доставку',
} as const;

// The screen after the right code.
export const ORDER_DELIVERED_TEXTS = {
  TITLE: 'Заказ доставлен',
  BACK_TO_WORK: 'К работе',
  closed: (order: string, time: string) => `${order} закрыт в ${time}.`,
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
