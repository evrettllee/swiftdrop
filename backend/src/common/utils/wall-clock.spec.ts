import { formatWallDateTime, wallClock } from './wall-clock';

const MOMENT = new Date('2026-10-31T21:30:00.000Z');

describe('wallClock', () => {
  it('should read the wall clock of each time zone', () => {
    expect(formatWallDateTime(wallClock(MOMENT, 'Europe/Minsk'))).toBe('01.11.2026 00:30');
    expect(formatWallDateTime(wallClock(MOMENT, 'America/New_York'))).toBe('31.10.2026 17:30');
    expect(wallClock(MOMENT, 'Europe/Minsk')).toEqual({
      year: 2026,
      month: 11,
      day: 1,
      hour: 0,
      minute: 30,
    });
  });

  it('should build the formatter of a time zone once for many dates', () => {
    const constructor = jest.spyOn(Intl, 'DateTimeFormat');

    for (let minute = 0; minute < 50; minute += 1) {
      wallClock(new Date(MOMENT.getTime() + minute * 60_000), 'Asia/Tokyo');
    }

    expect(constructor).toHaveBeenCalledTimes(1);
    constructor.mockRestore();
  });
});
