import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/shared/api';
import {
  EXPORT_FAILURE,
  exportManagerOrders,
  type ExportRequest,
  toExportFailure,
} from '@/shared/staff-api';
import { saveFile } from '@/shared/lib/dom';
import { EXPORT_TEXTS } from '../config/texts';

const FALLBACK_FILENAME = 'swiftdrop-orders';

function failureMessage(error: unknown): string {
  const failure = toExportFailure(error);

  if (failure?.kind === EXPORT_FAILURE.TOO_LARGE) {
    return EXPORT_TEXTS.tooLarge(failure.total);
  }

  return failure?.kind === EXPORT_FAILURE.TOO_MANY
    ? EXPORT_TEXTS.TOO_MANY
    : getApiErrorMessage(error, EXPORT_TEXTS.FAILED);
}

export function useOrdersExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const start = useCallback(async (request: ExportRequest): Promise<boolean> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsExporting(true);
    setError(null);

    try {
      const file = await exportManagerOrders(
        request,
        `${FALLBACK_FILENAME}.${request.format}`,
        controller.signal,
      );
      saveFile(file.blob, file.filename);

      return true;
    } catch (caught) {
      if (!controller.signal.aborted) {
        setError(failureMessage(caught));
      }

      return false;
    } finally {
      if (controllerRef.current === controller) {
        setIsExporting(false);
      }
    }
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    setIsExporting(false);
    setError(null);
  }, []);

  return { isExporting, error, start, cancel };
}
