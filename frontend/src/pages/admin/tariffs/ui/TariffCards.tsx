import { PencilSimpleIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatShortDay, formatShortPersonName } from '@/shared/lib/format';
import { IconButton } from '@/shared/ui/icon-button';
import { Switch } from '@/shared/ui/switch';
import type { AdminTariff } from '../api/admin-tariffs';
import { ADMIN_TARIFFS_TEXTS as TEXTS } from '../config/texts';
import { formatPrice } from '../lib/number-input';
import { zonesText } from '../lib/zones';
import type { TariffEdit } from '../model/useTariffEdit';
import type { useTariffStatus } from '../model/useTariffStatus';

function Price({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-small text-fg-secondary">{label}</span>
      <span className="font-semibold tabular-nums">{`${formatPrice(value)} ${TEXTS.CURRENCY}`}</span>
    </div>
  );
}

type TariffCardProps = {
  tariff: AdminTariff;
  edit: TariffEdit;
  status: ReturnType<typeof useTariffStatus>;
};

function TariffCard({ tariff, edit, status }: TariffCardProps) {
  const person =
    tariff.updatedBy === null
      ? null
      : formatShortPersonName(tariff.updatedBy.firstName, tariff.updatedBy.lastName);

  return (
    <article className="flex flex-col gap-3 rounded-lg bg-surface p-4 shadow-md dark:border dark:border-border">
      <div className="flex items-center justify-between gap-3">
        <h2 className="min-w-0 text-body font-semibold break-words">{tariff.name}</h2>
        <IconButton
          aria-label={TEXTS.edit(tariff.name)}
          onClick={() => edit.startEdit(tariff)}
          className="-me-2 text-fg-secondary"
        >
          <PencilSimpleIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
        </IconButton>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Price label={TEXTS.LABEL_KM} value={tariff.pricePerKm} />
        <Price label={TEXTS.LABEL_KG} value={tariff.pricePerKg} />
        <Price label={TEXTS.LABEL_MIN} value={tariff.minPrice} />
        <Price label={TEXTS.LABEL_FRAGILE} value={tariff.fragileFee} />
      </div>
      <div className="flex flex-col gap-1 text-small">
        <span>{zonesText(tariff.zones, true)}</span>
        <span className="text-fg-secondary tabular-nums">
          {TEXTS.changed(formatShortDay(tariff.updatedAt), person)}
        </span>
      </div>
      <Switch
        isOn={tariff.isActive}
        disabled={status.busyId === tariff.tariffId}
        label={TEXTS.switchLabel(tariff.name)}
        className="self-start"
        onChange={(isOn) => status.toggle(tariff, isOn)}
      >
        {tariff.isActive ? TEXTS.ON : TEXTS.OFF}
      </Switch>
    </article>
  );
}

type TariffCardsProps = {
  items: readonly AdminTariff[];
  edit: TariffEdit;
  status: ReturnType<typeof useTariffStatus>;
};

export function TariffCards({ items, edit, status }: TariffCardsProps) {
  return (
    <ul aria-label={TEXTS.TABLE_LABEL} className="flex flex-col gap-4">
      {items.map((tariff) => (
        <li key={tariff.tariffId}>
          <TariffCard tariff={tariff} edit={edit} status={status} />
        </li>
      ))}
    </ul>
  );
}
