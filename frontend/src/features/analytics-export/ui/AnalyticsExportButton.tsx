import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { ANALYTICS_EXPORT_TEXTS as TEXTS } from '../config/export-config';

type AnalyticsExportButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export function AnalyticsExportButton({ onClick, disabled = false }: AnalyticsExportButtonProps) {
  return (
    <Button
      variant="secondary"
      disabled={disabled}
      icon={<DownloadSimpleIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
      onClick={onClick}
    >
      {TEXTS.BUTTON}
    </Button>
  );
}
