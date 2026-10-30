import {
  EXPORT_HEADERS,
  EXPORT_NO_STORE,
  EXPORT_NOSNIFF,
} from '../constants/manager-export.constants';
import type { ExportFile } from '../types/manager-export.types';

export function contentDisposition(filename: string): string {
  return `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export function exportHeaders({ filename, contentType }: ExportFile): Record<string, string> {
  return {
    [EXPORT_HEADERS.CONTENT_TYPE]: contentType,
    [EXPORT_HEADERS.CONTENT_DISPOSITION]: contentDisposition(filename),
    [EXPORT_HEADERS.CACHE_CONTROL]: EXPORT_NO_STORE,
    [EXPORT_HEADERS.CONTENT_TYPE_OPTIONS]: EXPORT_NOSNIFF,
  };
}
