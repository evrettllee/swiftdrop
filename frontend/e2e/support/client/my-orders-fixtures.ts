const DAY_MS = 24 * 60 * 60 * 1000;

export type RawAddress = { city: string; street: string; house: string; apartment: null };

export type RawMyOrder = {
  orderId: number;
  status: string;
  price: number;
  currency: string;
  createdAt: string;
  estimatedDeliveryAt: null;
  pickup: RawAddress;
  delivery: RawAddress;
  courier: { name: string } | null;
};

function address(street: string, house: string): RawAddress {
  return { city: 'Минск', street, house, apartment: null };
}

function order(
  orderId: number,
  status: string,
  price: number,
  daysAgo: number,
  [from, to]: [[string, string], [string, string]],
  courier: string | null,
): RawMyOrder {
  return {
    orderId,
    status,
    price,
    currency: 'BYN',
    createdAt: new Date(Date.now() - daysAgo * DAY_MS).toISOString(),
    estimatedDeliveryAt: null,
    pickup: address(...from),
    delivery: address(...to),
    courier: courier === null ? null : { name: courier },
  };
}

export function myOrders(): RawMyOrder[] {
  return [
    order(
      48232,
      'in_transit',
      11.08,
      1,
      [
        ['Свердлова', '13а'],
        ['Притыцкого', '83'],
      ],
      'Дмитрий С.',
    ),
    order(
      48201,
      'delivered',
      7.4,
      5,
      [
        ['Независимости', '58'],
        ['Немига', '5'],
      ],
      'Алина Г.',
    ),
    order(
      48156,
      'delivered',
      9.85,
      13,
      [
        ['Бобруйская', '6'],
        ['Сурганова', '47а'],
      ],
      'Илья Т.',
    ),
    order(
      48102,
      'delivered',
      12.6,
      21,
      [
        ['Каменногорская', '29'],
        ['Мясникова', '39'],
      ],
      'Алексей Р.',
    ),
    order(
      48090,
      'cancelled',
      8.2,
      27,
      [
        ['Притыцкого', '83'],
        ['Свердлова', '13а'],
      ],
      null,
    ),
    order(
      48050,
      'delivered',
      6.3,
      40,
      [
        ['Кальварийская', '21'],
        ['Немига', '3'],
      ],
      'Ольга М.',
    ),
    order(
      48010,
      'delivered',
      10.1,
      55,
      [
        ['Победителей', '9'],
        ['Кирова', '12'],
      ],
      'Илья Т.',
    ),
    order(
      47980,
      'delivered',
      5.9,
      70,
      [
        ['Сурганова', '2'],
        ['Якуба Коласа', '33'],
      ],
      'Алина Г.',
    ),
  ];
}

export function olderOrders(count: number): RawMyOrder[] {
  return Array.from({ length: count }, (_, index) =>
    order(
      47900 - index,
      'delivered',
      7 + index / 10,
      80 + index,
      [
        ['Немига', '5'],
        ['Сурганова', '47а'],
      ],
      'Ольга М.',
    ),
  );
}
