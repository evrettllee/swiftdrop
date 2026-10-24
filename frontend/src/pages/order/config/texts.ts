import { UI_TEXTS } from '@/shared/config';

export const ORDER_DETAILS_TEXTS = {
  BREADCRUMBS_LABEL: 'Хлебные крошки',
  ORDERS: UI_TEXTS.ORDERS,
  BACK_TO_ORDERS: 'Все заказы',
  title: (orderNumber: string) => `Заказ ${orderNumber}`,
  createdAt: (date: string) => `Оформлен ${date}`,
  LOAD_FAILED: 'Не удалось загрузить заказ. Попробуйте ещё раз',
  LOAD_FAILED_TITLE: 'Не удалось загрузить заказ',
  NOT_FOUND_TITLE: 'Заказ не найден',
  NOT_FOUND_TEXT: 'Возможно, ссылка устарела или заказ оформлен с другой учётной записи.',
  RETRY: UI_TEXTS.RETRY,
  SECTION_PROGRESS: 'Ход заказа',
  SECTION_ROUTE: 'Маршрут',
  SECTION_RECIPIENT: 'Получатель и посылка',
  RECIPIENT: 'Получатель',
  PHONE: 'Телефон',
  WEIGHT: 'Вес',
  SIZE: 'Размеры',
  FRAGILE: 'Хрупкое',
  YES: 'Да',
  NO: 'Нет',
} as const;

const CANCEL_ORDER = 'Отменить заказ';

export const CANCEL_TEXTS = {
  title: (orderNumber: string) => `${CANCEL_ORDER} ${orderNumber}?`,
  CONFIRM: CANCEL_ORDER,
  KEEP: 'Не отменять',
  PAID_BEFORE: 'Курьер ещё не забрал посылку, поэтому заказ можно отменить. Оплата ',
  PAID_AFTER: ' вернётся на карту, которой вы платили.',
  UNPAID: 'Заказ ещё не оплачен, поэтому деньги не спишутся.',
  FAILED: 'Не удалось отменить заказ. Попробуйте ещё раз',
} as const;

// The lines of the price itself are PRICE_TEXTS of the price entity.
export const PAYMENT_TEXTS = {
  SECTION: 'Оплата',
  PAID: 'Оплачено',
  UNPAID: 'Не оплачено',
  REFUNDED: 'Деньги возвращены',
  RETRY_PAY: 'Попробовать снова',
  CANCEL: CANCEL_ORDER,
  CANCEL_HINT: 'Отменить можно, пока курьер не забрал посылку.',
  REPEAT: 'Повторить заказ',
  REPEAT_HINT:
    'Адреса, получатель и посылка подставятся в новый заказ, стоимость рассчитаем заново',
  START_FAILED: 'Не удалось начать оплату. Попробуйте ещё раз',
  pay: (amount: string) => `Оплатить ${amount}`,
} as const;

export const STATUS_LINE_TEXTS = {
  WAITING_TITLE: 'Заказ ждёт оплаты',
  waiting: (time: string) => `Оплатите до ${time}, иначе заказ отменится автоматически.`,
  FAILED_TITLE: 'Платёж не прошёл',
  failed: (time: string) =>
    `Деньги не списаны. Попробуйте ещё раз до ${time}, иначе заказ отменится автоматически.`,
  CHECKING_TITLE: 'Проверяем оплату',
  CHECKING: 'Это займёт несколько секунд.',
  SEARCHING: 'Как только курьер примет заказ, он появится на карте.',
  pickupIn: (minutes: number) => `Курьер приедет за посылкой через ${minutes} мин`,
  deliveryIn: (minutes: number) => `Курьер привезёт посылку через ${minutes} мин`,
  deliveryBy: (time: string) => `Доставка ориентировочно к ${time}`,
  HEADING_TO_PICKUP: 'Курьер едет за посылкой',
  CARRYING: 'Курьер везёт посылку',
  OFFLINE_TITLE: 'Нет связи с курьером',
  offline: (minutes: number) =>
    `Обновлено ${minutes} мин назад. Время уточнится, когда связь вернётся.`,
  deliveredAt: (time: string) => `Доставлен в ${time}`,
  DELIVERED: 'Доставлен',
  recipient: (name: string) => `Получатель: ${name}`,
  CANCELLED_TITLE: 'Заказ отменён',
  REFUNDED: 'Оплата возвращена на карту.',
  UNPAID_EXPIRED: (minutes: number) => `Не оплачен за ${minutes} минут`,
  UNPAID_CANCELLED: 'Деньги не списаны.',
  REJECTED_TITLE: 'Заказ отклонён',
  REJECTED_REFUND: 'Деньги вернутся на карту',
} as const;
