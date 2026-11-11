import type { Page } from '@playwright/test';
import { minutesAgo, type RawMessage } from './manager-support-fixtures';

export const ORDER_ID = 48232;
export const OTHER_ORDER_ID = 48230;
const TICKETS_PAGE = 20;

export type RawMyTicket = ReturnType<typeof myTicket>;

export function myTicket(id: number, title: string, minutes: number) {
  return {
    id,
    title,
    topic: 'order_problem',
    status: 'open' as 'open' | 'closed',
    awaitingStaff: false,
    lastMessageAt: minutesAgo(minutes),
    createdAt: minutesAgo(minutes + 5),
    order: null as { orderId: number; status: string; deliveryAddress: string } | null,
    lastMessage: {
      text: 'Сейчас передам курьеру',
      fromStaff: true,
      createdAt: minutesAgo(minutes),
    } as { text: string; fromStaff: boolean; createdAt: string } | null,
    unreadCount: 0,
    closedAt: null as string | null,
  };
}

export function closedTickets(count: number, firstId: number): RawMyTicket[] {
  return Array.from({ length: count }, (_, index) => {
    const item = myTicket(firstId + index, `Закрытое обращение ${index + 1}`, 100 + index);
    item.status = 'closed';
    item.closedAt = minutesAgo(90 + index);

    return item;
  });
}

export function rawMyTickets(): RawMyTicket[] {
  const answered = myTicket(91, 'Курьер не может найти подъезд', 5);
  answered.order = {
    orderId: ORDER_ID,
    status: 'in_transit',
    deliveryAddress: 'Минск, пр-т Притыцкого, 83',
  };
  const awaiting = myTicket(92, 'Не приходят предложения заказов', 15);
  awaiting.awaitingStaff = true;
  awaiting.lastMessage = {
    text: 'Второй час на линии',
    fromStaff: false,
    createdAt: minutesAgo(15),
  };

  return [answered, awaiting, ...closedTickets(2, 93)];
}

export function authorMessages(): RawMessage[] {
  return [
    {
      id: 1,
      text: 'Курьер звонит, а я не слышу. Можно передать, что подъезд со двора?',
      createdAt: minutesAgo(30),
      fromStaff: false,
      authorName: 'Анна Тестова',
      isRead: true,
    },
    {
      id: 2,
      text: 'Сейчас передам курьеру',
      createdAt: minutesAgo(5),
      fromStaff: true,
      authorName: 'Ольга, поддержка',
      isRead: false,
    },
  ];
}

function toListItem({ closedAt: _closedAt, ...item }: RawMyTicket) {
  return {
    ...item,
    order: item.order === null ? null : { orderId: item.order.orderId, status: item.order.status },
  };
}

export function myTicketsPage(tickets: RawMyTicket[], search: URLSearchParams) {
  const status = search.get('status');
  const limit = Number(search.get('limit') ?? String(TICKETS_PAGE));
  const cursor = search.get('cursor');
  const start = cursor === null ? 0 : Number(cursor);
  const all = tickets
    .filter((item) => status === null || item.status === status)
    .toSorted((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt));
  const end = start + limit;

  return {
    items: all.slice(start, end).map(toListItem),
    nextCursor: end < all.length ? String(end) : null,
    ...(cursor === null ? { total: all.length } : {}),
  };
}

export function clientOrders() {
  const address = (street: string, house: string) => ({
    city: 'Минск',
    street,
    house,
    apartment: null,
  });

  return [ORDER_ID, OTHER_ORDER_ID].map((orderId, index) => ({
    orderId,
    status: index === 0 ? 'in_transit' : 'delivered',
    price: 12,
    currency: 'BYN',
    createdAt: minutesAgo(60 + index * 60 * 24),
    estimatedDeliveryAt: null,
    pickup: address('ул. Богдановича', '12'),
    delivery: address(index === 0 ? 'пр-т Притыцкого' : 'ул. Кирова', index === 0 ? '83' : '120'),
    courier: null,
  }));
}

export function field(page: Page) {
  return page.getByRole('textbox', { name: 'Сообщение в поддержку' });
}

export function log(page: Page) {
  return page.getByRole('log', { name: 'Переписка с поддержкой' });
}

export function staffMessage(id: number, text: string) {
  return {
    ticketId: 91,
    message: {
      id,
      text,
      createdAt: new Date().toISOString(),
      fromStaff: true,
      authorName: 'Ольга, поддержка',
      isRead: false,
    },
  };
}
