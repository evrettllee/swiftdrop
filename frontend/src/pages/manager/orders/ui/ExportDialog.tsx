import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { EXPORT_FORMAT, type ExportFormat, type ManagerOrdersListQuery } from '@/shared/staff-api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Dialog } from '@/shared/ui/dialog';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { RadioCard } from '@/shared/ui/radio-card';
import { EXPORT_FORMAT_TEXTS, EXPORT_TEXTS } from '../config/texts';
import { useOrdersExport } from '../model/useOrdersExport';

const FORMATS: readonly ExportFormat[] = [EXPORT_FORMAT.XLSX, EXPORT_FORMAT.CSV];

type ExportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  query: ManagerOrdersListQuery;
  count: number | null;
  scope: readonly string[];
};

export function ExportDialog({ isOpen, onClose, query, count, scope }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>(EXPORT_FORMAT.XLSX);
  const [withPhones, setWithPhones] = useState(false);
  const exporter = useOrdersExport();

  function close(): void {
    exporter.cancel();
    onClose();
  }

  async function submit(): Promise<void> {
    if (await exporter.start({ ...query, format, withPhones })) {
      onClose();
    }
  }

  return (
    <Dialog
      width="wide"
      hasDividers
      isOpen={isOpen}
      onClose={close}
      title={EXPORT_TEXTS.TITLE}
      actions={
        <>
          <Button
            loading={exporter.isExporting}
            icon={
              <DownloadSimpleIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
            }
            onClick={() => void submit()}
          >
            {EXPORT_TEXTS.SUBMIT}
          </Button>
          <Button variant="secondary" onClick={close}>
            {EXPORT_TEXTS.CANCEL}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-1">
        {count === null ? null : (
          <p className="font-semibold text-fg tabular-nums">{EXPORT_TEXTS.count(count)}</p>
        )}
        <p className="text-small">{EXPORT_TEXTS.scope(scope)}</p>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-caption font-semibold tracking-caps text-fg-secondary uppercase">
          {EXPORT_TEXTS.FORMAT}
        </legend>
        {FORMATS.map((item) => (
          <RadioCard
            key={item}
            name="manager-orders-export-format"
            title={EXPORT_FORMAT_TEXTS[item].title}
            description={EXPORT_FORMAT_TEXTS[item].description}
            checked={format === item}
            onChange={() => setFormat(item)}
          />
        ))}
      </fieldset>
      <div className="text-fg">
        <Checkbox
          label={EXPORT_TEXTS.WITH_PHONES}
          checked={withPhones}
          onChange={(event) => setWithPhones(event.target.checked)}
        />
      </div>
      {exporter.error === null ? null : (
        <InlineAlert variant="error" title={EXPORT_TEXTS.FAILED_TITLE}>
          {exporter.error}
        </InlineAlert>
      )}
    </Dialog>
  );
}
