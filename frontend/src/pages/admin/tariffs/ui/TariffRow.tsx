import { PencilSimpleIcon } from '@phosphor-icons/react';
import { memo, useEffect, useRef } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { IconButton } from '@/shared/ui/icon-button';
import { Switch } from '@/shared/ui/switch';
import { TABLE_ALIGN, TableCell, TableRow } from '@/shared/ui/table';
import type { AdminTariff } from '../api/admin-tariffs';
import { ADMIN_TARIFFS_TEXTS as TEXTS } from '../config/texts';
import { formatPrice } from '../lib/number-input';
import { zonesText } from '../lib/zones';
import { ChangedText } from './ChangedText';

type TariffRowProps = {
  tariff: AdminTariff;
  isLocked: boolean;
  isBusy: boolean;
  isFocusTarget: boolean;
  onFocused: () => void;
  onEdit: (tariff: AdminTariff) => void;
  onToggle: (tariff: AdminTariff, isOn: boolean) => void;
};

export const TariffRow = memo(function TariffRow({
  tariff,
  isLocked,
  isBusy,
  isFocusTarget,
  onFocused,
  onEdit,
  onToggle,
}: TariffRowProps) {
  const editRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isFocusTarget) {
      editRef.current?.focus();
      onFocused();
    }
  }, [isFocusTarget, onFocused]);

  return (
    <TableRow>
      <TableCell className="font-semibold">{tariff.name}</TableCell>
      {[tariff.pricePerKm, tariff.pricePerKg, tariff.minPrice, tariff.fragileFee].map(
        (price, index) => (
          <TableCell key={index} align={TABLE_ALIGN.END} className="tabular-nums">
            {formatPrice(price)}
          </TableCell>
        ),
      )}
      <TableCell className="text-fg-secondary">{zonesText(tariff.zones, false)}</TableCell>
      <TableCell>
        <ChangedText tariff={tariff} />
      </TableCell>
      <TableCell>
        <Switch
          isOn={tariff.isActive}
          disabled={isBusy}
          label={TEXTS.switchLabel(tariff.name)}
          onChange={(isOn) => onToggle(tariff, isOn)}
        >
          {tariff.isActive ? TEXTS.ON : TEXTS.OFF}
        </Switch>
      </TableCell>
      <TableCell align={TABLE_ALIGN.END}>
        <IconButton
          ref={editRef}
          aria-label={TEXTS.edit(tariff.name)}
          disabled={isLocked}
          onClick={() => onEdit(tariff)}
          className="text-fg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PencilSimpleIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
});
