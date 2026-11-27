import {
  ANALYTICS_EXPORT_SECTION,
  type AnalyticsExportRole,
  type AnalyticsExportSection,
} from '@/shared/analytics-api';
import { EXPORT_FORMAT, type ExportFormat } from '@/shared/staff-api';
import { DEFAULT_CSV_SECTION, ROLE_EXPORT_SECTIONS } from '../config/export-config';

export type AnalyticsExportState = {
  format: ExportFormat;
  xlsxSections: AnalyticsExportSection[];
  csvSection: AnalyticsExportSection;
};

export function createInitialExportState(role: AnalyticsExportRole): AnalyticsExportState {
  const allowed = ROLE_EXPORT_SECTIONS[role];

  return {
    format: EXPORT_FORMAT.XLSX,
    xlsxSections: [...allowed],
    csvSection: allowed.includes(DEFAULT_CSV_SECTION) ? DEFAULT_CSV_SECTION : allowed[0],
  };
}

export function csvSectionsFor(role: AnalyticsExportRole): readonly AnalyticsExportSection[] {
  return ROLE_EXPORT_SECTIONS[role].filter(
    (section) => section !== ANALYTICS_EXPORT_SECTION.SUMMARY,
  );
}

export function toggleXlsxSection(
  selected: readonly AnalyticsExportSection[],
  target: AnalyticsExportSection,
  allowed: readonly AnalyticsExportSection[],
): AnalyticsExportSection[] {
  const next = new Set(selected);

  if (next.has(target)) {
    next.delete(target);
  } else {
    next.add(target);
  }

  return allowed.filter((section) => next.has(section));
}

export function selectedSectionsOf(state: AnalyticsExportState): readonly AnalyticsExportSection[] {
  return state.format === EXPORT_FORMAT.CSV ? [state.csvSection] : state.xlsxSections;
}

export function canSubmitExport(state: AnalyticsExportState): boolean {
  return selectedSectionsOf(state).length > 0;
}
