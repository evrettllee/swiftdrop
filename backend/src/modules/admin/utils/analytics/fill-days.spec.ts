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
