import { APP_LOCALE } from '@/shared/config';
import type { ManagerZone } from '@/shared/staff-api';

const nameCollator = new Intl.Collator(APP_LOCALE);

export function visibleZones(
  zones: readonly ManagerZone[],
  search: string,
  isDisabledShown: boolean,
): ManagerZone[] {
  const query = search.trim().toLocaleLowerCase(APP_LOCALE);

  return zones
    .filter((zone) => isDisabledShown || zone.isActive)
    .filter((zone) => query === '' || zone.name.toLocaleLowerCase(APP_LOCALE).includes(query))
    .sort((left, right) => nameCollator.compare(left.name, right.name) || left.id - right.id);
}
