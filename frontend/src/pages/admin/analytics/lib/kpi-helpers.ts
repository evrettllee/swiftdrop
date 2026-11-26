import { APP_CURRENCY } from '@/shared/config';
import {
  changePercent,
  formatDecimal,
  formatMoney,
  formatSignedPercent,
  formatWhole,
} from '@/shared/lib/format';
import type { KpiChange, KpiTone } from '@/shared/ui/analytics';
import { ADMIN_ANALYTICS_TEXTS as TEXTS } from '../config/texts';

const DECIMAL_MONEY_DIGITS = 2;

export function formatMoneyCompact(amount: number): string {
  return Number.isInteger(amount)
    ? `${formatWhole(amount)} ${APP_CURRENCY}`
    : formatMoney(amount, APP_CURRENCY, DECIMAL_MONEY_DIGITS);
}

export function periodComparisonLabel(isWeekPreset: boolean): string {
  return isWeekPreset ? TEXTS.TO_LAST_WEEK : TEXTS.TO_PREVIOUS_PERIOD;
}

export function comparisonTone(delta: number, higherIsBetter: boolean): KpiTone {
  if (delta === 0) {
    return 'neutral';
  }

  const isImproved = higherIsBetter ? delta > 0 : delta < 0;

  return isImproved ? 'positive' : 'negative';
}

export function percentComparisonChange(
  value: number,
  previous: number,
  isWeekPreset: boolean,
  higherIsBetter: boolean,
  formatPrevious?: (prev: number) => string,
): KpiChange | null {
  const pct = changePercent(value, previous);

  if (pct !== null && pct !== 0) {
    return {
      direction: pct > 0 ? 'up' : 'down',
      tone: comparisonTone(pct, higherIsBetter),
      text: `${formatSignedPercent(pct)} ${periodComparisonLabel(isWeekPreset)}`,
    };
  }

  if (pct === 0) {
    return {
      tone: 'neutral',
      text: `${formatSignedPercent(0)} ${periodComparisonLabel(isWeekPreset)}`,
    };
  }

  if (value === 0 && previous === 0) {
    return null;
  }

  const delta = value - previous;

  return {
    direction: delta > 0 ? 'up' : 'down',
    tone: comparisonTone(delta, higherIsBetter),
    text: TEXTS.was(formatPrevious ? formatPrevious(previous) : formatWhole(previous)),
  };
}

export function numericDeltaChange(
  value: number | null,
  previous: number | null,
  higherIsBetter: boolean,
  prefix: string | null,
  formatPrev: (prev: number) => string = (prev) => formatDecimal(prev),
): KpiChange | null {
  if (value === null || previous === null) {
    return prefix === null ? null : { tone: 'neutral', text: prefix };
  }

  const delta = value - previous;
  const wasPart = TEXTS.was(formatPrev(previous));
  const text = prefix === null ? wasPart : `${prefix}, ${wasPart}`;

  if (delta === 0) {
    return { tone: 'neutral', text };
  }

  return {
    direction: delta > 0 ? 'up' : 'down',
    tone: comparisonTone(delta, higherIsBetter),
    text,
  };
}

export function buildPctKpi(
  key: string,
  label: string,
  pct: number | null,
  prevPct: number | null,
  higherIsBetter: boolean,
  prefix: string | null,
) {
  return {
    key,
    label,
    value: pct === null ? TEXTS.NO_DATA : `${pct}%`,
    change: numericDeltaChange(pct, prevPct, higherIsBetter, prefix, (prev) => `${prev}%`),
  };
}

export function buildMeasuredKpi(
  key: string,
  label: string,
  value: number | null,
  previous: number | null,
  higherIsBetter: boolean,
  formatValue: (val: number) => string,
  prefix: string | null = null,
  formatPrev: (prev: number) => string = formatValue,
) {
  return {
    key,
    label,
    value: value === null ? TEXTS.NO_DATA : formatValue(value),
    change: numericDeltaChange(value, previous, higherIsBetter, prefix, formatPrev),
  };
}
