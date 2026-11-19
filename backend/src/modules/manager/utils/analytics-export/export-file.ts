import {
  EXPORT_CONTENT_TYPE,
  EXPORT_FORMAT,
  type ExportFormat,
} from '@/modules/manager/constants/manager-export.constants';
import type { ExportFile, ExportSheet } from '@/modules/manager/types/manager-export.types';
import { toCsv } from '../export-csv';
import { toXlsxBook } from '../export-xlsx';

export type AnalyticsExportRequest = {
  prefix: string;
  from: string;
  to: string;
  format: ExportFormat;
};

export async function analyticsExportFile(
  { prefix, from, to, format }: AnalyticsExportRequest,
  sheets: readonly ExportSheet[],
): Promise<ExportFile> {
  const body = format === EXPORT_FORMAT.CSV ? toCsv(sheets[0].table) : await toXlsxBook(sheets);

  return {
    filename: `${prefix}-${from}_${to}.${format}`,
    contentType: EXPORT_CONTENT_TYPE[format],
    body,
  };
}

export function lazy<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined;

  return () => {
    pending ??= load();

    return pending;
  };
}
