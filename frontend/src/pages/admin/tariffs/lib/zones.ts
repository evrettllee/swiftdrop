import type { TariffZone } from '../api/admin-tariffs';
import { ADMIN_TARIFFS_TEXTS as TEXTS } from '../config/texts';

export function zonesText(zones: readonly TariffZone[], isPhone: boolean): string {
  const hasActive = zones.some((zone) => zone.isActive);

  if (zones.length === 0) {
    return isPhone ? TEXTS.ZONES_PHONE_NONE : TEXTS.NO_ZONES;
  }

  if (!hasActive) {
    return isPhone ? TEXTS.ZONES_PHONE_NO_ACTIVE : TEXTS.NO_ACTIVE_ZONES;
  }

  const names = zones
    .map((zone) => (zone.isActive ? zone.name : `${zone.name} ${TEXTS.ZONE_OFF}`))
    .join(', ');

  return isPhone ? `${TEXTS.ZONES_PHONE}${names}` : names;
}

export function activeZoneNames(zones: readonly TariffZone[]): string {
  return zones
    .filter((zone) => zone.isActive)
    .map((zone) => `«${zone.name}»`)
    .join(', ');
}
