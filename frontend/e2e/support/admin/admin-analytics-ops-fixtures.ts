export function usersPayload(
  from: string,
  to: string,
  datesBetween: (f: string, t: string) => string[],
) {
  const days = datesBetween(from, to);
  const counts = [7, 9, 11, 8, 6, 10, 13];

  return {
    period: { from, to },
    kpis: {
      newClients: { value: 64, previous: 52 },
      activeClients: { value: 211, previous: 190 },
      repeatClients: { value: { repeat: 80, active: 211 }, previous: { repeat: 67, active: 190 } },
      couriersOnline: { onShift: 14, total: 37 },
      averageDeliveriesPerCourier: { value: 21, previous: 19 },
    },
    newClientsByDay: days.map((date, index) => ({ date, count: counts[index % counts.length] })),
    ordersPerClient: { one: 131, two: 46, threeToFive: 27, sixPlus: 7 },
  };
}

export function supportPayload(
  from: string,
  to: string,
  datesBetween: (f: string, t: string) => string[],
) {
  const days = datesBetween(from, to);
  const medians = [9, 14, 11, 10, 18, 12, 8];

  return {
    period: { from, to },
    kpis: {
      ticketsCreated: { value: 27, previous: 31 },
      firstResponseMedianMinutes: { value: 12, previous: 15 },
      closed: { value: { closed: 23, total: 27 }, previous: { closed: 24, total: 31 } },
      unansweredNow: { count: 2, longestWaitMinutes: 18 },
    },
    topics: [
      { topic: 'order_problem', count: 11 },
      { topic: 'payment', count: 7 },
      { topic: 'client_unreachable', count: 5 },
      { topic: 'other', count: 4 },
    ],
    firstResponseByDay: days.map((date, index) => ({
      date,
      medianMinutes: medians[index % medians.length],
      tickets: 4,
    })),
  };
}

export function servicePayload(
  from: string,
  to: string,
  datesBetween: (f: string, t: string) => string[],
) {
  const days = datesBetween(from, to);
  const counts = [1, 0, 3, 2, 0, 5, 1];

  return {
    period: { from, to },
    kpis: {
      serverErrors: { value: 12, previous: 4 },
      externalFailures: {
        value: { failures: 7, services: 4 },
        previous: { failures: 9, services: 4 },
      },
      mailFailures: { count: 1, lastAt: '2026-11-10T13:40:00.000Z' },
      savedRateUsed: 2,
    },
    serverErrorsByDay: days.map((date, index) => ({ date, count: counts[index % counts.length] })),
    services: [
      { service: 'osrm', failures: 3, lastAt: '2026-11-12T11:20:00.000Z', lastCode: 'timeout' },
      {
        service: 'nbrb',
        failures: 2,
        lastAt: '2026-11-11T15:05:00.000Z',
        lastCode: 'saved_rate_used',
      },
      { service: 'mail', failures: 1, lastAt: '2026-11-10T13:40:00.000Z', lastCode: 'send_failed' },
      {
        service: 'stripe',
        failures: 1,
        lastAt: '2026-11-09T09:12:00.000Z',
        lastCode: 'webhook_bad_signature',
      },
    ],
    recent: [
      {
        lastAt: '2026-11-12T11:20:00.000Z',
        firstAt: '2026-11-12T11:18:00.000Z',
        service: 'osrm',
        code: 'timeout',
        message: 'timeout after 5000ms on /route/v1',
        repeats: 3,
      },
      {
        lastAt: '2026-11-11T15:05:00.000Z',
        firstAt: '2026-11-11T15:05:00.000Z',
        service: 'nbrb',
        code: 'saved_rate_used',
        message: 'fallback rate from 11.11 09:00',
        repeats: 2,
      },
    ],
  };
}
