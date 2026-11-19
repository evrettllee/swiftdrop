import { fillDays } from './fill-days';

describe('fillDays', () => {
  it('should give every day of the period in order with zeros where nothing happened', () => {
    const rows = [
      { date: '2026-10-03', revenue: 12.5, delivered: 2 },
      { date: '2026-10-01', revenue: 7, delivered: 1 },
    ];

    expect(fillDays('2026-10-01', '2026-10-04', rows, { revenue: 0, delivered: 0 })).toEqual([
      { date: '2026-10-01', revenue: 7, delivered: 1 },
      { date: '2026-10-02', revenue: 0, delivered: 0 },
      { date: '2026-10-03', revenue: 12.5, delivered: 2 },
      { date: '2026-10-04', revenue: 0, delivered: 0 },
    ]);
  });

  it('should fill an empty day with null where a value cannot be zero', () => {
    type Day = { medianMinutes: number | null; tickets: number };
    const rows = [{ date: '2026-10-02', medianMinutes: 12.5, tickets: 3 }];
    const empty: Day = { medianMinutes: null, tickets: 0 };

    expect(fillDays<Day>('2026-10-01', '2026-10-02', rows, empty)).toEqual([
      { date: '2026-10-01', medianMinutes: null, tickets: 0 },
      { date: '2026-10-02', medianMinutes: 12.5, tickets: 3 },
    ]);
  });

  it('should cross a month and drop rows outside the period', () => {
    const rows = [
      { date: '2026-02-26', onTime: 9, total: 9 },
      { date: '2026-03-01', onTime: 1, total: 2 },
    ];

    expect(fillDays('2026-02-28', '2026-03-01', rows, { onTime: 0, total: 0 })).toEqual([
      { date: '2026-02-28', onTime: 0, total: 0 },
      { date: '2026-03-01', onTime: 1, total: 2 },
    ]);
  });
});
