import { PentagonIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { RADIUS_TEXTS as TEXTS } from '../config/texts';
import { formatRadiusField, parseRadiusKm } from '../lib/radius-field';

type RadiusFieldProps = {
  radiusKm: number;
  onRadius: (radiusKm: number) => void;
  onToPoints: () => void;
};

export function RadiusField({ radiusKm, onRadius, onToPoints }: RadiusFieldProps) {
  const shown = formatRadiusField(radiusKm);
  const [text, setText] = useState({ value: shown, shown });

  if (text.shown !== shown) {
    setText({ value: shown, shown });
  }

  const isInvalid = parseRadiusKm(text.value) === null;

  function change(value: string): void {
    setText({ value, shown });
    const parsed = parseRadiusKm(value);

    if (parsed !== null) {
      onRadius(parsed);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        label={TEXTS.RADIUS}
        value={text.value}
        inputMode="decimal"
        hint={TEXTS.RADIUS_HINT}
        error={isInvalid ? TEXTS.RADIUS_INVALID : undefined}
        onChange={(event) => change(event.target.value)}
      />
      <div className="flex flex-col *:max-lg:w-full lg:items-start">
        <Button
          variant="secondary"
          icon={<PentagonIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
          onClick={onToPoints}
        >
          {TEXTS.TO_POINTS}
        </Button>
      </div>
    </div>
  );
}
