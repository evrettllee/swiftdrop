import { z } from 'zod';
import { ApiError, downloadFile, HTTP_STATUS } from '@/shared/api';
import { readAttachmentFilename } from './content-disposition';
import {
  listQuery,
  MANAGER_ORDERS_API_PATHS,
  type ManagerOrdersListQuery,
  setIf,
} from './manager-orders';
import {
  EXPORT_TOO_LARGE_CODE,
  MANAGER_FLAG_TRUE,
  MANAGER_ORDERS_PARAM,
  type ExportFormat,
} from './manager-orders-params';

export type ExportRequest = ManagerOrdersListQuery & {
  format: ExportFormat;
  withPhones: boolean;
};

export function buildManagerExportQuery(request: ExportRequest): URLSearchParams {
  const query = listQuery(request);
  query.set(MANAGER_ORDERS_PARAM.FORMAT, request.format);
  setIf(query, MANAGER_ORDERS_PARAM.WITH_PHONES, request.withPhones ? MANAGER_FLAG_TRUE : null);

  return query;
}

export type ExportedFile = {
  blob: Blob;
  filename: string;
};

export async function exportManagerOrders(
  request: ExportRequest,
  fallbackFilename: string,
  signal?: AbortSignal,
): Promise<ExportedFile> {
  const query = buildManagerExportQuery(request);
  const file = await downloadFile(`${MANAGER_ORDERS_API_PATHS.EXPORT}?${query.toString()}`, {
    signal,
  });

  return {
    blob: file.blob,
    filename: readAttachmentFilename(file.contentDisposition) ?? fallbackFilename,
  };
}

export const EXPORT_FAILURE = {
  TOO_LARGE: 'too_large',
  TOO_MANY: 'too_many',
} as const;

export type ExportFailure =
  | { kind: typeof EXPORT_FAILURE.TOO_LARGE; total: number }
  | { kind: typeof EXPORT_FAILURE.TOO_MANY };

const exportTooLargeSchema = z.object({
  code: z.literal(EXPORT_TOO_LARGE_CODE),
  total: z.number(),
});

export function toExportFailure(error: unknown): ExportFailure | null {
  if (!(error instanceof ApiError)) {
    return null;
  }

  if (error.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
    return { kind: EXPORT_FAILURE.TOO_MANY };
  }

  const tooLarge =
    error.status === HTTP_STATUS.UNPROCESSABLE_CONTENT
      ? exportTooLargeSchema.safeParse(error.body)
      : null;

  return tooLarge?.success === true
    ? { kind: EXPORT_FAILURE.TOO_LARGE, total: tooLarge.data.total }
    : null;
}
