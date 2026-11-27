import { expect, test } from '@playwright/test';
import {
  ADMIN_EXPORT_SECTIONS,
  ANALYTICS_EXPORT_ROLE,
  ANALYTICS_EXPORT_SECTION,
  buildAnalyticsExportQuery,
  fallbackAnalyticsExportFilename,
  MANAGER_EXPORT_SECTIONS,
} from './analytics-export';
import { EXPORT_FORMAT } from '@/shared/staff-api';

test('should build export query with period, format and ordered comma-separated sections', () => {
  const query = buildAnalyticsExportQuery({
    from: '2026-11-06',
    to: '2026-11-12',
    format: EXPORT_FORMAT.XLSX,
    sections: [ANALYTICS_EXPORT_SECTION.SUMMARY, ANALYTICS_EXPORT_SECTION.ZONES],
  });

  expect(query).toBe('from=2026-11-06&to=2026-11-12&format=xlsx&sections=summary%2Czones');
});

test('should build fallback export filenames for admin and manager roles', () => {
  expect(
    fallbackAnalyticsExportFilename({
      role: ANALYTICS_EXPORT_ROLE.ADMIN,
      from: '2026-11-06',
      to: '2026-11-12',
      format: EXPORT_FORMAT.XLSX,
    }),
  ).toBe('swiftdrop-analytics-2026-11-06-2026-11-12.xlsx');

  expect(
    fallbackAnalyticsExportFilename({
      role: ANALYTICS_EXPORT_ROLE.MANAGER,
      from: '2026-11-06',
      to: '2026-11-12',
      format: EXPORT_FORMAT.CSV,
    }),
  ).toBe('swiftdrop-manager-analytics-2026-11-06-2026-11-12.csv');
});

test('should match backend export section lists for admin and manager', () => {
  expect(ADMIN_EXPORT_SECTIONS).toEqual(['summary', 'days', 'zones', 'couriers', 'failures']);
  expect(MANAGER_EXPORT_SECTIONS).toEqual(['summary', 'days', 'hours', 'zones', 'couriers']);
});
