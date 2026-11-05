import { ORDER_STATUS, type OrderListItem } from '@/shared/api';

const ADDRESS = { city: 'Минск', street: 'ул. Свердлова', house: '13а', apartment: null };

export function buildOrderListItem(orderId: number): OrderListItem {
  return {
    orderId,
    status: ORDER_STATUS.DELIVERED,
    price: 11.08,
    currency: 'BYN',
    createdAt: new Date('2026-10-26T11:52:00.000Z'),
    estimatedDeliveryAt: null,
    pickup: ADDRESS,
    delivery: ADDRESS,
    courier: null,
  };
}
