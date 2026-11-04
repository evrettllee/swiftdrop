export const ORDER_ID = 48232;
const MESSAGES_PAGE = 30;

export type RawMessage = {
  id: number;
  text: string;
  createdAt: string;
  fromStaff: boolean;
  authorName: string;
  isRead: boolean;
};

export type RawTicket = ReturnType<typeof ticket>;

export function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function ticket(
  id: number,
  name: string,
  role: 'client' | 'courier',
  title: string,
  waitMin: number,
) {
  return {
    id,
    title,
    topic: 'order_problem',
    status: 'open' as 'open' | 'closed',
    awaitingStaff: true,
    lastMessageAt: minutesAgo(waitMin),
    createdAt: minutesAgo(waitMin + 2),
    waitingSec: (waitMin * 60) as number | null,
    author: { userId: id * 10, name, role, phone: '+375296182240' },
    order: null as { orderId: number; status: string; deliveryAddress: string } | null,
    lastMessage: { text: 'Он уже 5 минут ищет', fromStaff: false },
    closedAt: null as string | null,
    closedBy: null as { role: 'author' | 'staff'; name: string } | null,
  };
}

export function rawTickets(): RawTicket[] {
  const first = ticket(91, 'Анна Кравец', 'client', 'Курьер не может найти подъезд', 18);
  first.order = {
    orderId: ORDER_ID,
    status: 'in_transit',
    deliveryAddress: 'Минск, Сурганова, 12',
  };
  const second = ticket(92, 'Алина Гордей', 'courier', 'Клиент не отвечает на звонки', 9);
  second.lastMessage = { text: 'Стою у двери 7 минут, домофон не работает', fromStaff: false };
  const closed = ticket(
    93,
    'Наталья Савчук',
    'client',
    'Не пришёл возврат за отменённый заказ',
    40,
  );
  Object.assign(closed, {
    status: 'closed',
    awaitingStaff: false,
    waitingSec: null,
    closedAt: minutesAgo(30),
    closedBy: { role: 'staff', name: 'Ольга М.' },
    lastMessage: { text: 'Поняла, спасибо!', fromStaff: false },
  });

  return [first, second, closed];
}

export function messagesOf(count: number): RawMessage[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    text: index === count - 1 ? 'Он уже 5 минут ищет' : `Сообщение ${index + 1}`,
    createdAt: minutesAgo(count - index),
    fromStaff: index % 5 === 3,
    authorName: index % 5 === 3 ? 'Ольга М.' : 'Анна Кравец',
    isRead: true,
  }));
}

export function listOf(tickets: RawTicket[], search: URLSearchParams) {
  const view = search.get('view') ?? 'awaiting';
  const role = search.get('authorRole');
  const q = search.get('q');
  const items = tickets
    .filter((item) =>
      view === 'closed'
        ? item.status === 'closed'
        : item.status === 'open' && (view === 'open' || item.awaitingStaff),
    )
    .filter((item) => role === null || item.author.role === role)
    .filter((item) => q === null || item.author.name.includes(q) || String(item.id) === q)
    .map(({ closedAt: _closedAt, closedBy: _closedBy, ...item }) => ({
      ...item,
      author: { userId: item.author.userId, name: item.author.name, role: item.author.role },
      order:
        item.order === null ? null : { orderId: item.order.orderId, status: item.order.status },
    }));
  const limit = Number(search.get('limit') ?? '20');

  return { items: items.slice(0, limit), total: items.length, page: 1, limit, until: 1000 };
}

export function messagesPage(messages: RawMessage[], search: URLSearchParams) {
  const all = messages.toReversed();
  const cursor = search.get('cursor');
  const start = cursor === null ? 0 : all.findIndex((item) => item.id < Number(cursor));
  const items = start < 0 ? [] : all.slice(start, start + MESSAGES_PAGE);
  const rest = start < 0 ? [] : all.slice(start + MESSAGES_PAGE);

  return { items, nextCursor: rest.length === 0 ? null : String(items.at(-1)?.id) };
}
