import { RADIUS_KM } from '../config/draw';
import { APP_LOCALE } from '@/shared/config';

const STEPS_PER_KM = Math.round(1 / RADIUS_KM.STEP);
const radiusFieldFormat = new Intl.NumberFormat(APP_LOCALE, {
  maximumFractionDigits: 1,
  useGrouping: false,
});

export function formatRadiusField(radiusKm: number): string {
  return radiusFieldFormat.format(radiusKm);
}

export function parseRadiusKm(text: string): number | null {
  const value = Number(text.trim().replace(',', '.'));

  if (text.trim() === '' || !Number.isFinite(value)) {
    return null;
  }

  const rounded = Math.round(value * STEPS_PER_KM) / STEPS_PER_KM;

  return rounded >= RADIUS_KM.MIN && rounded <= RADIUS_KM.MAX ? rounded : null;
}
