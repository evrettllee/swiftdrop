import { expect, test } from '@playwright/test';
import { ANALYTICS_EXPORT_ROLE, ANALYTICS_EXPORT_SECTION } from '@/shared/analytics-api';
import { EXPORT_FORMAT } from '@/shared/staff-api';
import {
  canSubmitExport,
  createInitialExportState,
  csvSectionsFor,
  selectedSectionsOf,
  toggleXlsxSection,
} from './export-state';

test('should initialize export with xlsx and all role sections selected', () => {
  const admin = createInitialExportState(ANALYTICS_EXPORT_ROLE.ADMIN);
  const manager = createInitialExportState(ANALYTICS_EXPORT_ROLE.MANAGER);

  expect(admin).toEqual({
    format: EXPORT_FORMAT.XLSX,
    xlsxSections: ['summary', 'days', 'zones', 'couriers', 'failures'],
    csvSection: 'days',
  });
  expect(manager).toEqual({
    format: EXPORT_FORMAT.XLSX,
    xlsxSections: ['summary', 'days', 'hours', 'zones', 'couriers'],
    csvSection: 'days',
  });
  expect(canSubmitExport(admin)).toBe(true);
});

test('should exclude summary from csv options and preserve canonical order on toggle', () => {
  expect(csvSectionsFor(ANALYTICS_EXPORT_ROLE.ADMIN)).toEqual([
    'days',
    'zones',
    'couriers',
    'failures',
  ]);
  expect(csvSectionsFor(ANALYTICS_EXPORT_ROLE.MANAGER)).toEqual([
    'days',
    'hours',
    'zones',
    'couriers',
  ]);

  const withoutSummary = toggleXlsxSection(
    ['summary', 'days', 'zones'],
    ANALYTICS_EXPORT_SECTION.SUMMARY,
    ['summary', 'days', 'zones', 'couriers', 'failures'],
  );
  expect(withoutSummary).toEqual(['days', 'zones']);

  const withFailures = toggleXlsxSection(withoutSummary, ANALYTICS_EXPORT_SECTION.FAILURES, [
    'summary',
    'days',
    'zones',
    'couriers',
    'failures',
  ]);
  expect(withFailures).toEqual(['days', 'zones', 'failures']);
});

test('should disallow submit when xlsx has zero sections selected', () => {
  const state = {
    format: EXPORT_FORMAT.XLSX,
    xlsxSections: [],
    csvSection: ANALYTICS_EXPORT_SECTION.DAYS,
  };

  expect(canSubmitExport(state)).toBe(false);
  expect(selectedSectionsOf({ ...state, format: EXPORT_FORMAT.CSV })).toEqual(['days']);
});
