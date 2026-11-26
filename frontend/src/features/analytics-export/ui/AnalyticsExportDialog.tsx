import { DownloadSimpleIcon } from '@phosphor-icons/react';
import type { AnalyticsExportRole, AnalyticsPeriodQuery } from '@/shared/analytics-api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatDateRangeWithYear } from '@/shared/lib/calendar';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { ANALYTICS_EXPORT_TEXTS as TEXTS } from '../config/export-config';
import { useAnalyticsExport } from '../model/useAnalyticsExport';
import { FormatFieldset, SectionsFieldset } from './ExportDialogFields';

type AnalyticsExportDialogProps = {
  role: AnalyticsExportRole;
  period: AnalyticsPeriodQuery | null;
  isOpen: boolean;
  onClose: () => void;
};

export function AnalyticsExportDialog({
  role,
  period,
  isOpen,
  onClose,
}: AnalyticsExportDialogProps) {
  const model = useAnalyticsExport(role, period, onClose);
  const icon = (
    <DownloadSimpleIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
  );

  return (
    <Dialog
      width="wide"
      hasDividers
      isOpen={isOpen}
      onClose={model.closeAndReset}
      title={TEXTS.TITLE}
      actions={
        isOpen ? (
          <>
            <Button
              variant="primary"
              icon={icon}
              loading={model.isExporting}
              disabled={!model.canSubmit}
              onClick={() => void model.submit()}
            >
              {TEXTS.SUBMIT}
            </Button>
            <Button variant="secondary" onClick={model.closeAndReset}>
              {TEXTS.CANCEL}
            </Button>
          </>
        ) : null
      }
    >
      {isOpen ? (
        <>
          {model.error === null ? null : <InlineAlert variant="error" title={model.error} />}
          {period === null ? null : (
            <div className="flex items-baseline justify-between gap-4 text-body">
              <span className="text-small text-fg-secondary">{TEXTS.PERIOD}</span>
              <span className="font-normal text-fg tabular-nums">
                {formatDateRangeWithYear(period.from, period.to)}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-4 text-fg">
            <FormatFieldset format={model.state.format} onChange={model.setFormat} />
            <SectionsFieldset
              role={role}
              format={model.state.format}
              xlsxSections={model.state.xlsxSections}
              csvSection={model.state.csvSection}
              onToggleXlsx={model.toggleSection}
              onSelectCsv={model.setCsvSection}
            />
          </div>
        </>
      ) : null}
    </Dialog>
  );
}
