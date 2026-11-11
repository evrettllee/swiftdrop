import { APP_LOCALE } from '@/shared/config';
import { METERS_PER_KM } from '../config/draw';
import { DRAW_TEXTS } from '../config/texts';

const radiusFormat = new Intl.NumberFormat(APP_LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatRadiusKm(radiusM: number): string {
  return DRAW_TEXTS.radius(radiusFormat.format(radiusM / METERS_PER_KM));
}
