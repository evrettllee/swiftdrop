import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type AnalyticsExportRole,
  type AnalyticsExportSection,
  type AnalyticsPeriodQuery,
  exportAnalytics,
  isTooManyRequests,
} from '@/shared/analytics-api';
import { getApiErrorMessage } from '@/shared/api';
import { saveFile } from '@/shared/lib/dom';
import type { ExportFormat } from '@/shared/staff-api';
import { ANALYTICS_EXPORT_TEXTS, ROLE_EXPORT_SECTIONS } from '../config/export-config';
import {
  type AnalyticsExportState,
  canSubmitExport,
  createInitialExportState,
  selectedSectionsOf,
  toggleXlsxSection,
} from './export-state';

function readExportError(caught: unknown): string {
  return isTooManyRequests(caught)
    ? ANALYTICS_EXPORT_TEXTS.TOO_MANY
    : getApiErrorMessage(caught, ANALYTICS_EXPORT_TEXTS.ERROR_FALLBACK);
}

async function runExport(
  role: AnalyticsExportRole,
  period: AnalyticsPeriodQuery,
  state: AnalyticsExportState,
  signal: AbortSignal,
  onDone: () => void,
  setError: (msg: string | null) => void,
): Promise<void> {
  try {
    const file = await exportAnalytics(
      { role, ...period, format: state.format, sections: selectedSectionsOf(state) },
      { signal },
    );

    if (!signal.aborted) {
      saveFile(file.blob, file.filename);
      onDone();
    }
  } catch (caught) {
    if (!signal.aborted) {
      setError(readExportError(caught));
    }
  }
}

function createFieldActions(
  role: AnalyticsExportRole,
  setState: React.Dispatch<React.SetStateAction<AnalyticsExportState>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
) {
  const apply = (patch: (cur: AnalyticsExportState) => AnalyticsExportState) => {
    setError(null);
    setState(patch);
  };

  return {
    setFormat: (format: ExportFormat) => apply((cur) => ({ ...cur, format })),
    toggleSection: (section: AnalyticsExportSection) =>
      apply((cur) => ({
        ...cur,
        xlsxSections: toggleXlsxSection(cur.xlsxSections, section, ROLE_EXPORT_SECTIONS[role]),
      })),
    setCsvSection: (csvSection: AnalyticsExportSection) => apply((cur) => ({ ...cur, csvSection })),
  };
}

export function useAnalyticsExport(
  role: AnalyticsExportRole,
  period: AnalyticsPeriodQuery | null,
  onClose: () => void,
) {
  const [state, setState] = useState(() => createInitialExportState(role));
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const closeAndReset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState(createInitialExportState(role));
    setIsExporting(false);
    setError(null);
    onClose();
  }, [role, onClose]);

  const submit = async () => {
    if (isExporting || period === null || !canSubmitExport(state)) {
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsExporting(true);
    setError(null);
    await runExport(role, period, state, controller.signal, closeAndReset, setError);
    if (controllerRef.current === controller) {
      controllerRef.current = null;
    }
    setIsExporting(false);
  };

  return {
    state,
    isExporting,
    error,
    canSubmit: period !== null && canSubmitExport(state),
    ...createFieldActions(role, setState, setError),
    closeAndReset,
    submit,
  };
}
