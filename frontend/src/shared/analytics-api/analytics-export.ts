import { downloadFile, type HttpOptions } from '@/shared/api';
import { EXPORT_FORMAT, type ExportFormat, readAttachmentFilename } from '@/shared/staff-api';
import { type AnalyticsPeriodQuery, buildPeriodSearchParams } from './period-query';

export const ANALYTICS_EXPORT_ROLE = {
  ADMIN: 'admin',
  MANAGER: 'manager',
} as const;

export type AnalyticsExportRole =
  (typeof ANALYTICS_EXPORT_ROLE)[keyof typeof ANALYTICS_EXPORT_ROLE];

export const ANALYTICS_EXPORT_SECTION = {
  SUMMARY: 'summary',
  DAYS: 'days',
  HOURS: 'hours',
  ZONES: 'zones',
  COURIERS: 'couriers',
  FAILURES: 'failures',
} as const;

export type AnalyticsExportSection =
  (typeof ANALYTICS_EXPORT_SECTION)[keyof typeof ANALYTICS_EXPORT_SECTION];

export const ADMIN_EXPORT_SECTIONS: readonly AnalyticsExportSection[] = [
  ANALYTICS_EXPORT_SECTION.SUMMARY,
  ANALYTICS_EXPORT_SECTION.DAYS,
  ANALYTICS_EXPORT_SECTION.ZONES,
  ANALYTICS_EXPORT_SECTION.COURIERS,
  ANALYTICS_EXPORT_SECTION.FAILURES,
];

export const MANAGER_EXPORT_SECTIONS: readonly AnalyticsExportSection[] = [
  ANALYTICS_EXPORT_SECTION.SUMMARY,
  ANALYTICS_EXPORT_SECTION.DAYS,
  ANALYTICS_EXPORT_SECTION.HOURS,
  ANALYTICS_EXPORT_SECTION.ZONES,
  ANALYTICS_EXPORT_SECTION.COURIERS,
];

export const ANALYTICS_EXPORT_API_PATHS: Record<AnalyticsExportRole, string> = {
  [ANALYTICS_EXPORT_ROLE.ADMIN]: '/admin/analytics/export',
  [ANALYTICS_EXPORT_ROLE.MANAGER]: '/manager/analytics/export',
};

const FILE_PREFIXES: Record<AnalyticsExportRole, string> = {
  [ANALYTICS_EXPORT_ROLE.ADMIN]: 'swiftdrop-analytics',
  [ANALYTICS_EXPORT_ROLE.MANAGER]: 'swiftdrop-manager-analytics',
};

export type AnalyticsExportRequest = AnalyticsPeriodQuery & {
  role: AnalyticsExportRole;
  format: ExportFormat;
  sections: readonly AnalyticsExportSection[];
};

export type AnalyticsExportedFile = {
  blob: Blob;
  filename: string;
};

export function buildAnalyticsExportQuery({
  from,
  to,
  format,
  sections,
}: Omit<AnalyticsExportRequest, 'role'>): string {
  const params = buildPeriodSearchParams({ from, to });
  params.set('format', format);
  params.set('sections', sections.join(','));

  return params.toString();
}

export function fallbackAnalyticsExportFilename({
  role,
  from,
  to,
  format,
}: Omit<AnalyticsExportRequest, 'sections'>): string {
  const extension = format === EXPORT_FORMAT.CSV ? EXPORT_FORMAT.CSV : EXPORT_FORMAT.XLSX;

  return `${FILE_PREFIXES[role]}-${from}-${to}.${extension}`;
}

export async function exportAnalytics(
  request: AnalyticsExportRequest,
  options: HttpOptions = {},
): Promise<AnalyticsExportedFile> {
  const path = `${ANALYTICS_EXPORT_API_PATHS[request.role]}?${buildAnalyticsExportQuery(request)}`;
  const file = await downloadFile(path, options);

  return {
    blob: file.blob,
    filename:
      readAttachmentFilename(file.contentDisposition) ?? fallbackAnalyticsExportFilename(request),
  };
}
