import { ORDER_STATUS, type OrderStatus } from '@/shared/api';

export const ORDER_TEXTS = {
  ORDER_NUMBER_PREFIX: '№',
  // The parts of an address are joined by it: "Свердлова, 13а".
  ADDRESS_PARTS_SEPARATOR: ', ',
  apartment: (apartment: string) => `кв. ${apartment}`,
} as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [ORDER_STATUS.PENDING]: 'Ожидает оплаты',
  [ORDER_STATUS.CONFIRMED]: 'Подтверждён',
  [ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT]: 'Подбираем курьера',
  [ORDER_STATUS.COURIER_ASSIGNED]: 'Курьер назначен',
  [ORDER_STATUS.PICKED_UP]: 'Курьер забрал',
  [ORDER_STATUS.IN_TRANSIT]: 'В пути',
  [ORDER_STATUS.DELIVERED]: 'Доставлен',
  [ORDER_STATUS.CANCELLED]: 'Отменён',
  [ORDER_STATUS.REJECTED]: 'Отклонён',
};
