import { ORDER_OFFER_STATUS, type OrderOfferStatus } from '@/shared/staff-api';

export const OFFER_ANSWER_LABELS: Record<OrderOfferStatus, string> = {
  [ORDER_OFFER_STATUS.ACCEPTED]: 'Принято',
  [ORDER_OFFER_STATUS.DECLINED]: 'Отказ',
  [ORDER_OFFER_STATUS.EXPIRED]: 'Нет ответа',
  [ORDER_OFFER_STATUS.REVOKED]: 'Отозвано',
  [ORDER_OFFER_STATUS.PENDING]: 'Ждёт ответа',
};

export const OFFER_ANSWER_CLASSES: Record<OrderOfferStatus, string> = {
  [ORDER_OFFER_STATUS.ACCEPTED]: 'text-success',
  [ORDER_OFFER_STATUS.DECLINED]: 'text-fg-secondary',
  [ORDER_OFFER_STATUS.EXPIRED]: 'text-fg-secondary',
  [ORDER_OFFER_STATUS.REVOKED]: 'text-fg-secondary',
  [ORDER_OFFER_STATUS.PENDING]: 'text-fg',
};
