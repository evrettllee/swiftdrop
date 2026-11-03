import { PencilSimpleIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { getManagerZonePath } from '@/shared/routes';
import type { ManagerZone } from '@/shared/staff-api';
import { ZONE_ROW_TEXTS } from '../config/texts';

export function ZoneEditLink({ zone }: { zone: ManagerZone }) {
  return (
    <Link
      to={getManagerZonePath(zone.id)}
      aria-label={ZONE_ROW_TEXTS.edit(zone.name)}
      className={`-me-2 inline-grid size-11 place-items-center rounded-md text-fg-secondary hover:bg-selected hover:text-accent ${COLOR_TRANSITION_CLASS}`}
    >
      <PencilSimpleIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
    </Link>
  );
}
