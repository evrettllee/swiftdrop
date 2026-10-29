import { managerOrderDetailsSchema } from '../dto/manager-order-details.dto';
import {
  type ManagerOrderDetailsRows,
  toManagerOrderDetails,
} from './manager-order-details.mapper';

const AT = new Date('2026-10-29T10:00:00.000Z');
const LATER = new Date('2026-10-29T11:00:00.000Z');
const POINT = { city: 'Минск', street: 'ул. Свердлова', house: '13а', apartment: '5' };

const ROWS: ManagerOrderDetailsRows = {
  order: {
    orderId: 241,
    status: 'courier_assigned',
    createdAt: AT,
    statusChangedAt: LATER,
    finishedAt: null,
    client: {
      id: 7,
      firstName: 'Иван',
      lastName: 'Петров',
      phone: '+375291234567',
      email: 'ivan@example.com',
    },
    courierId: 3,
    courier: { firstName: 'Дмитрий', lastName: 'Соколов', phone: '+375297654321' },
    vehicle: { type: 'car', brand: 'Skoda', model: 'Octavia', plate: '1234 AB-7' },
    recipient: { name: 'Анна Козлова', phone: '+375291112233' },
    pickup: { ...POINT, latitude: 53.89, longitude: 27.55 },
    delivery: { ...POINT, apartment: null, latitude: 53.91, longitude: 27.6 },
    parcel: { weight: 1.5, length: 30, width: 20, height: 10, fragile: true },
    price: '9.23',
    coefficient: 1.2,
    distanceKm: 4.3,
    estimatedMinutes: 25,
    tariffName: 'Стандарт',
  },
  payments: [{ status: 'paid', paidAt: AT, refundedAt: null }],
  history: [
    { status: 'pending', changedAt: AT, changedBy: 7, role: 'client', comment: null },
    { status: 'confirmed', changedAt: AT, changedBy: null, role: null, comment: null },
    { status: 'courier_assigned', changedAt: LATER, changedBy: 9, role: 'courier', comment: 'ok' },
  ],
  offers: [
    {
      round: 1,
      courierId: 4,
      firstName: 'Олег',
      lastName: 'Иванов',
      vehicleType: null,
      status: 'expired',
      pickupEtaSec: 300,
      offeredAt: AT,
      respondedAt: null,
    },
  ],
  tickets: [
    {
      id: 5,
      topic: 'order_problem',
      subject: null,
      status: 'open',
      awaitingStaff: true,
      lastMessageAt: LATER,
      userId: 9,
    },
    {
      id: 6,
      topic: 'payment',
      subject: null,
      status: 'closed',
      awaitingStaff: false,
      lastMessageAt: LATER,
      userId: 7,
    },
  ],
};

describe('toManagerOrderDetails', () => {
  it('should give every field of the page and nothing more', () => {
    const details = toManagerOrderDetails(ROWS);

    expect(managerOrderDetailsSchema.parse(details)).toEqual(details);
    expect(details).toMatchObject({
      client: { id: 7, name: 'Иван Петров', phone: '+375291234567', email: 'ivan@example.com' },
      courier: { id: 3, name: 'Дмитрий Соколов', vehicle: { plate: '1234 AB-7' } },
      route: { from: { apartment: '5', latitude: 53.89 }, to: { apartment: null } },
      pricing: { price: 9.23, coefficient: 1.2, tariffName: 'Стандарт' },
      offers: [{ round: 1, courier: { id: 4, name: 'Олег Иванов', vehicleType: null } }],
    });
  });

  it('should name who changed the status and keep the user ids out', () => {
    const { history } = toManagerOrderDetails(ROWS);

    expect(history.map((entry) => entry.actor)).toEqual(['client', 'system', 'courier']);
    expect(JSON.stringify(history)).not.toContain('changedBy');
  });

  it('should tell the tickets of the client from the tickets of the courier', () => {
    const { tickets } = toManagerOrderDetails(ROWS);

    expect(tickets.map((ticket) => [ticket.id, ticket.author])).toEqual([
      [5, 'courier'],
      [6, 'client'],
    ]);
    expect(tickets[0]).not.toHaveProperty('userId');
  });

  it('should give no courier while the order has none', () => {
    const order = { ...ROWS.order, courierId: null, courier: null, vehicle: null };

    expect(toManagerOrderDetails({ ...ROWS, order }).courier).toBeNull();
  });
});
