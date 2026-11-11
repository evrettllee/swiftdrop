import { expect, test } from '@playwright/test';
import { CALENDAR_PERIOD, calendarPeriod } from './period';

const WEDNESDAY_EVENING = new Date('2026-10-21T20:30:00.000Z');
const MONDAY_JUST_AFTER_MIDNIGHT = new Date('2026-10-25T21:05:00.000Z');
const SUNDAY_LATE = new Date('2026-10-25T20:55:00.000Z');

test('should start this week on Monday in Minsk and end it on Sunday', () => {
  expect(calendarPeriod(CALENDAR_PERIOD.THIS_WEEK, WEDNESDAY_EVENING)).toEqual({
    from: '2026-10-19',
    to: '2026-10-25',
  });
});

test('should take the week by the day in Minsk, not by the day in UTC', () => {
  expect(calendarPeriod(CALENDAR_PERIOD.THIS_WEEK, MONDAY_JUST_AFTER_MIDNIGHT)).toEqual({
    from: '2026-10-26',
    to: '2026-11-01',
  });
  expect(calendarPeriod(CALENDAR_PERIOD.THIS_WEEK, SUNDAY_LATE)).toEqual({
    from: '2026-10-19',
    to: '2026-10-25',
  });
});

test('should give the whole week before this one as the last week', () => {
  expect(calendarPeriod(CALENDAR_PERIOD.LAST_WEEK, WEDNESDAY_EVENING)).toEqual({
    from: '2026-10-12',
    to: '2026-10-18',
  });
  expect(calendarPeriod(CALENDAR_PERIOD.LAST_WEEK, new Date('2026-01-01T09:00:00.000Z'))).toEqual({
    from: '2025-12-22',
    to: '2025-12-28',
  });
});

test('should take this month from its first day to its last one in Minsk', () => {
  expect(calendarPeriod(CALENDAR_PERIOD.THIS_MONTH, WEDNESDAY_EVENING)).toEqual({
    from: '2026-10-01',
    to: '2026-10-31',
  });
  expect(calendarPeriod(CALENDAR_PERIOD.THIS_MONTH, new Date('2028-02-10T09:00:00.000Z'))).toEqual({
    from: '2028-02-01',
    to: '2028-02-29',
  });
  expect(calendarPeriod(CALENDAR_PERIOD.THIS_MONTH, new Date('2026-12-31T21:30:00.000Z'))).toEqual({
    from: '2027-01-01',
    to: '2027-01-31',
  });
});

test('should give no bounds for the whole time', () => {
  expect(calendarPeriod(CALENDAR_PERIOD.ALL, WEDNESDAY_EVENING)).toEqual({ from: null, to: null });
});
