import type { ManagerOrdersFilter } from '@/shared/staff-api';
import type { OrdersParams } from '../config/list-params';
import { EMPTY_TEXTS, FILTER_TEXTS, PAYMENT_LABELS, TAB_LABELS } from '../config/texts';
import {
  detectPreset,
  formatCalendarDay,
  PERIOD_PRESET,
  PERIOD_PRESET_DAYS,
} from '@/shared/lib/calendar';
import type { OrdersView } from './orders-view';
import { SEARCH_KIND, searchKindOf } from '@/shared/staff-api';

export const APPLIED_FILTER = {
  PERIOD: 'period',
  COURIER: 'courier',
  PAYMENT: 'payment',
  FRAGILE: 'fragile',
  OPEN_TICKET: 'openTicket',
} as const;

export type AppliedFilterId = (typeof APPLIED_FILTER)[keyof typeof APPLIED_FILTER];

export type AppliedFilter = {
  id: AppliedFilterId;
  name: string;
  value: string;
  scope?: string;
  reset: Partial<OrdersParams>;
};

export function periodLabel(filter: ManagerOrdersFilter, now: Date): string | null {
  const preset = detectPreset(filter, now);

  if (preset === PERIOD_PRESET.ALL) {
    return null;
  }

  if (preset !== PERIOD_PRESET.CUSTOM) {
    return FILTER_TEXTS.periodDays(PERIOD_PRESET_DAYS[preset]);
  }

  if (filter.from !== null && filter.to !== null) {
    return FILTER_TEXTS.periodRange(formatCalendarDay(filter.from), formatCalendarDay(filter.to));
  }

  return filter.from === null
    ? FILTER_TEXTS.periodTo(formatCalendarDay(filter.to ?? ''))
    : FILTER_TEXTS.periodFrom(formatCalendarDay(filter.from));
}

export function appliedFilters(
  filter: ManagerOrdersFilter,
  now: Date,
  courierName: string | null,
): AppliedFilter[] {
  const result: AppliedFilter[] = [];
  const period = periodLabel(filter, now);

  if (period !== null) {
    result.push({
      id: APPLIED_FILTER.PERIOD,
      name: FILTER_TEXTS.PERIOD,
      value: period,
      reset: { from: null, to: null },
    });
  }

  if (filter.courierId !== null) {
    result.push({
      id: APPLIED_FILTER.COURIER,
      name: FILTER_TEXTS.COURIER,
      value: courierName ?? FILTER_TEXTS.courierFallback(filter.courierId),
      reset: { courierId: null },
    });
  }

  if (filter.payment.length > 0) {
    result.push({
      id: APPLIED_FILTER.PAYMENT,
      name: FILTER_TEXTS.PAYMENT,
      value: filter.payment.map((state) => PAYMENT_LABELS[state].toLowerCase()).join(', '),
      reset: { payment: [] },
    });
  }

  if (filter.fragile) {
    result.push({
      id: APPLIED_FILTER.FRAGILE,
      name: FILTER_TEXTS.PARCEL,
      value: FILTER_TEXTS.FRAGILE_CHIP,
      reset: { fragile: false },
    });
  }

  if (filter.hasOpenTicket) {
    result.push({
      id: APPLIED_FILTER.OPEN_TICKET,
      name: FILTER_TEXTS.TICKET,
      value: FILTER_TEXTS.OPEN_TICKET_CHIP,
      scope: FILTER_TEXTS.OPEN_TICKET_ONLY.toLowerCase(),
      reset: { hasOpenTicket: false },
    });
  }

  return result;
}

export function emptyResultText(view: OrdersView, now: Date): string {
  const { search } = view.filter;
  const preset = detectPreset(view.filter, now);
  let subject: string = EMPTY_TEXTS.BY_FILTERS;
  let advice: string = EMPTY_TEXTS.CHANGE_FILTERS;
  let period = '';

  if (search !== null) {
    const isNumber = searchKindOf(search) === SEARCH_KIND.NUMBER;
    subject = isNumber ? EMPTY_TEXTS.byNumber(search) : EMPTY_TEXTS.byText(search);
    advice = isNumber ? EMPTY_TEXTS.CHECK_NUMBER : EMPTY_TEXTS.CHECK_TEXT;
  }

  if (preset === PERIOD_PRESET.WEEK || preset === PERIOD_PRESET.MONTH) {
    period = EMPTY_TEXTS.periodLast(PERIOD_PRESET_DAYS[preset]);
  } else if (preset === PERIOD_PRESET.CUSTOM) {
    period = EMPTY_TEXTS.PERIOD_CUSTOM;
  }

  return `${subject}${period}${EMPTY_TEXTS.NONE}${advice}`;
}

export function exportScope(view: OrdersView, filters: readonly AppliedFilter[]): string[] {
  return [
    TAB_LABELS[view.tab].toLowerCase(),
    ...filters.map((filter) => filter.scope ?? filter.value),
  ];
}
