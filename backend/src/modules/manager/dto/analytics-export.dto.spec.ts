import type { ZodType } from 'zod';
import {
  ADMIN_EXPORT_SECTIONS,
  ANALYTICS_EXPORT_MESSAGES as MESSAGES,
  MANAGER_EXPORT_SECTIONS,
} from '../constants/analytics-export.constants';
import { MANAGER_EXPORT_MESSAGES } from '../constants/manager-export.constants';
import { analyticsExportSchema } from './analytics-export.dto';

const admin = analyticsExportSchema(ADMIN_EXPORT_SECTIONS);
const manager = analyticsExportSchema(MANAGER_EXPORT_SECTIONS);
const PERIOD = { from: '2026-10-01', to: '2026-10-07' };

function errorOf(schema: ZodType, query: Partial<Record<string, string>>) {
  const result = schema.safeParse({ ...PERIOD, ...query });

  return result.success
    ? null
    : result.error.issues.map(({ path, message }) => ({ path, message }));
}

describe('analyticsExportSchema', () => {
  it('should give the sections in the order of the window, not of the query', () => {
    expect(admin.parse({ ...PERIOD, format: 'xlsx', sections: 'failures,days,summary' })).toEqual({
      ...PERIOD,
      format: 'xlsx',
      sections: ['summary', 'days', 'failures'],
    });
    expect(manager.parse({ format: 'xlsx', sections: 'couriers,hours,hours' }).sections).toEqual([
      'hours',
      'couriers',
    ]);
  });

  it('should take one table for csv', () => {
    expect(admin.parse({ format: 'csv', sections: 'zones' }).sections).toEqual(['zones']);
  });

  it.each([{}, { sections: '' }, { sections: ',' }])(
    'should ask for at least one section when given %p',
    (query) => {
      expect(errorOf(admin, { format: 'xlsx', ...query })).toEqual([
        { path: ['sections'], message: MESSAGES.NO_SECTION },
      ]);
    },
  );

  it('should refuse an unknown section and one of the other role', () => {
    expect(errorOf(admin, { format: 'xlsx', sections: 'days,orders' })).toEqual([
      { path: ['sections'], message: MESSAGES.UNKNOWN_SECTION },
    ]);
    expect(errorOf(manager, { format: 'xlsx', sections: 'failures' })).toEqual([
      { path: ['sections'], message: MESSAGES.UNKNOWN_SECTION },
    ]);
    expect(errorOf(admin, { format: 'xlsx', sections: 'hours' })).toEqual([
      { path: ['sections'], message: MESSAGES.UNKNOWN_SECTION },
    ]);
  });

  it('should refuse more than one table or the summary for csv', () => {
    expect(errorOf(admin, { format: 'csv', sections: 'days,zones' })).toEqual([
      { path: ['sections'], message: MESSAGES.CSV_ONE_TABLE },
    ]);
    expect(errorOf(manager, { format: 'csv', sections: 'summary' })).toEqual([
      { path: ['sections'], message: MESSAGES.CSV_NO_SUMMARY },
    ]);
  });

  it('should refuse a missing or unknown format and an unknown parameter', () => {
    expect(errorOf(admin, { format: 'pdf', sections: 'days' })).toEqual([
      { path: ['format'], message: MANAGER_EXPORT_MESSAGES.FORMAT_INVALID },
    ]);
    expect(errorOf(admin, { sections: 'days' })).toEqual([
      { path: ['format'], message: MANAGER_EXPORT_MESSAGES.FORMAT_INVALID },
    ]);
    expect(errorOf(admin, { format: 'xlsx', sections: 'days', zone: '1' })).not.toBeNull();
  });

  it('should keep the period checks of the analytics', () => {
    expect(
      errorOf(admin, { format: 'xlsx', sections: 'days', from: '2026-10-05', to: '2026-10-01' }),
    ).toEqual([{ path: ['from'], message: expect.any(String) }]);
  });
});
