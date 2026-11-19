import type { ExportCellKind } from '@/modules/manager/types/manager-export.types';
import { shareOf } from '@/modules/manager/utils/analytics-export/export-sheet';
import type { Compared } from '@/modules/admin/types/admin-analytics.types';
import type { AdminSummaryInput } from '@/modules/admin/types/admin-analytics-export.types';

export type SummaryLine = {
  section: string;
  label: string;
  kind: ExportCellKind;
  value: (input: AdminSummaryInput) => Compared<number | null> | number | null;
};

function both<T>(value: Compared<T>, pick: (side: T) => number | null): Compared<number | null> {
  return { value: pick(value.value), previous: pick(value.previous) };
}

const BUSINESS = 'Бизнес';
const DELIVERY = 'Доставка';
const USERS = 'Пользователи';
const SUPPORT = 'Поддержка';
const SERVICE = 'Сервис';

export const SUMMARY_LINES: SummaryLine[] = [
  {
    section: BUSINESS,
    label: 'Заказов оформлено',
    kind: 'number',
    value: (i) => i.business.kpis.ordersCreated,
  },
  {
    section: BUSINESS,
    label: 'Выручка, BYN',
    kind: 'money',
    value: (i) => i.business.kpis.revenue,
  },
  {
    section: BUSINESS,
    label: 'Средний чек, BYN',
    kind: 'money',
    value: (i) => i.business.kpis.averageCheck,
  },
  {
    section: BUSINESS,
    label: 'Возвраты, BYN',
    kind: 'money',
    value: (i) => both(i.business.kpis.refunds, (r) => r.amount),
  },
  {
    section: DELIVERY,
    label: 'Доставлено вовремя',
    kind: 'percent',
    value: (i) => both(i.delivery.kpis.onTimeRate, (r) => shareOf(r.onTime, r.total)),
  },
  {
    section: DELIVERY,
    label: 'Среднее время доставки, мин',
    kind: 'decimal',
    value: (i) => i.delivery.kpis.averageDeliveryMinutes,
  },
  {
    section: DELIVERY,
    label: 'Назначено автоматически',
    kind: 'percent',
    value: (i) => both(i.delivery.kpis.autoAssignedRate, (r) => shareOf(r.auto, r.auto + r.manual)),
  },
  {
    section: DELIVERY,
    label: 'Поиск курьера, с',
    kind: 'number',
    value: (i) => i.delivery.kpis.averageSearchSeconds,
  },
  { section: USERS, label: 'Новые клиенты', kind: 'number', value: (i) => i.users.kpis.newClients },
  {
    section: USERS,
    label: 'Активные клиенты',
    kind: 'number',
    value: (i) => i.users.kpis.activeClients,
  },
  {
    section: USERS,
    label: 'Повторные клиенты',
    kind: 'number',
    value: (i) => both(i.users.kpis.repeatClients, (r) => r.repeat),
  },
  {
    section: USERS,
    label: 'Курьеров на линии',
    kind: 'number',
    value: (i) => i.users.kpis.couriersOnline.onShift,
  },
  {
    section: SUPPORT,
    label: 'Обращений',
    kind: 'number',
    value: (i) => i.support.kpis.ticketsCreated,
  },
  {
    section: SUPPORT,
    label: 'Первый ответ, мин',
    kind: 'decimal',
    value: (i) => i.support.kpis.firstResponseMedianMinutes,
  },
  {
    section: SUPPORT,
    label: 'Без ответа сейчас',
    kind: 'number',
    value: (i) => i.support.kpis.unansweredNow.count,
  },
  {
    section: SUPPORT,
    label: 'Закрыто',
    kind: 'percent',
    value: (i) => both(i.support.kpis.closed, (r) => shareOf(r.closed, r.total)),
  },
  {
    section: SERVICE,
    label: 'Ошибки сервера',
    kind: 'number',
    value: (i) => i.service.kpis.serverErrors,
  },
  {
    section: SERVICE,
    label: 'Сбои внешних сервисов',
    kind: 'number',
    value: (i) => both(i.service.kpis.externalFailures, (r) => r.failures),
  },
  {
    section: SERVICE,
    label: 'Неотправленные письма',
    kind: 'number',
    value: (i) => i.service.kpis.mailFailures.count,
  },
  {
    section: SERVICE,
    label: 'Оплата по сохранённому курсу',
    kind: 'number',
    value: (i) => i.service.kpis.savedRateUsed,
  },
];
