import { formatShortDate, formatShortPersonName } from '@/shared/lib/format';
import type { AdminTariff } from '../api/admin-tariffs';
import { ADMIN_TARIFFS_TEXTS as TEXTS } from '../config/texts';

export function ChangedText({ tariff }: { tariff: AdminTariff | null }) {
  if (tariff === null) {
    return <span className="text-fg-secondary">{TEXTS.CHANGED_NEW}</span>;
  }

  return (
    <span className="flex flex-col">
      <span className="tabular-nums">{formatShortDate(tariff.updatedAt)}</span>
      {tariff.updatedBy === null ? null : (
        <span className="text-caption text-fg-secondary">
          {formatShortPersonName(tariff.updatedBy.firstName, tariff.updatedBy.lastName)}
        </span>
      )}
    </span>
  );
}
