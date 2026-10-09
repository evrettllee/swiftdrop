export const ORDER_DETAILS_TEXTS = {
  BREADCRUMBS_LABEL: 'Хлебные крошки',
  ORDERS: 'Заказы',
  BACK_TO_ORDERS: 'Все заказы',
  title: (orderNumber: string) => `Заказ ${orderNumber}`,
  createdAt: (date: string) => `Оформлен ${date}`,
  LOAD_FAILED: 'Не удалось загрузить заказ. Попробуйте ещё раз',
  LOAD_FAILED_TITLE: 'Не удалось загрузить заказ',
  NOT_FOUND_TITLE: 'Заказ не найден',
  NOT_FOUND_TEXT: 'Возможно, ссылка устарела или заказ оформлен с другой учётной записи.',
  RETRY: 'Повторить',
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
  apartment: (apartment: string) => `кв. ${apartment}`,
  weight: (weight: string) => `${weight} кг`,
  size: (length: number, width: number, height: number) => `${length} × ${width} × ${height} см`,
} as const;

export const CANCEL_TEXTS = {
  title: (orderNumber: string) => `Отменить заказ ${orderNumber}?`,
  CONFIRM: 'Отменить заказ',
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
  CANCEL: 'Отменить заказ',
  CANCEL_HINT: 'Отменить можно, пока курьер не забрал посылку.',
  START_FAILED: 'Не удалось начать оплату. Попробуйте ещё раз',
  pay: (amount: string) => `Оплатить ${amount}`,
} as const;

export const PAYMENT_ALERT_TEXTS = {
  WAITING_TITLE: 'Заказ ждёт оплаты',
  waiting: (time: string) => `Оплатите до ${time}, иначе заказ отменится автоматически.`,
  FAILED_TITLE: 'Платёж не прошёл',
  failed: (time: string) =>
    `Деньги не списаны. Попробуйте ещё раз до ${time}, иначе заказ отменится автоматически.`,
  CHECKING_TITLE: 'Проверяем оплату',
  CHECKING: 'Это займёт несколько секунд.',
} as const;
