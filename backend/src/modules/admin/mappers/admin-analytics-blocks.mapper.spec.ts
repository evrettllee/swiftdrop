import { toServices, toTopics } from './admin-analytics-blocks.mapper';

describe('admin analytics blocks mapper', () => {
  it('should give every topic with zeros, by count, with ties in topic order and other last', () => {
    expect(
      toTopics([
        { topic: 'other', count: 9 },
        { topic: 'app', count: 2 },
        { topic: 'payment', count: 5 },
      ]),
    ).toEqual([
      { topic: 'payment', count: 5 },
      { topic: 'app', count: 2 },
      { topic: 'order_problem', count: 0 },
      { topic: 'account', count: 0 },
      { topic: 'client_unreachable', count: 0 },
      { topic: 'other', count: 9 },
    ]);
  });

  it('should give the four external services in order, empty where nothing failed', () => {
    const nbrb = {
      service: 'nbrb',
      failures: 3,
      lastAt: '2026-10-02T10:00:00.000Z',
      lastCode: 'timeout',
    } as const;

    expect(toServices([nbrb])).toEqual([
      { service: 'osrm', failures: 0, lastAt: null, lastCode: null },
      nbrb,
      { service: 'mail', failures: 0, lastAt: null, lastCode: null },
      { service: 'stripe', failures: 0, lastAt: null, lastCode: null },
    ]);
  });
});
