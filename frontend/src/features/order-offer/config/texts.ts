import { OFFER_NOTICE, type OfferNotice } from './offer';

export const OFFER_TEXTS = {
  TITLE: 'Новый заказ',
  TIME_LEFT: 'Время на ответ',
  minutes: (minutes: number) => `${minutes} мин`,
  TO_PICKUP: 'до забора',
  toPickup: (km: string) => `до забора, ${km} км`,
  WHOLE_ORDER: 'весь заказ',
  PICKUP: 'Забрать',
  DELIVERY: 'Доставить',
  DELIVERY_HINT: 'Точный адрес после принятия',
  WEIGHT: 'Вес',
  SIZE: 'Размеры',
  FRAGILE: 'Хрупкое',
  YES: 'Да',
  NO: 'Нет',
  ACCEPT: 'Принять заказ',
  DECLINE: 'Отказаться',
  RESPONSE_FAILED: 'Не удалось отправить ответ. Попробуйте ещё раз',
} as const;

export const OFFER_NOTICE_TEXTS: Record<OfferNotice, { title: string; text: string }> = {
  [OFFER_NOTICE.EXPIRED]: {
    title: 'Время на ответ вышло',
    text: 'Заказ передан другому курьеру.',
  },
  [OFFER_NOTICE.TAKEN]: {
    title: 'Заказ уже недоступен',
    text: 'Его отменили или принял другой курьер.',
  },
};
