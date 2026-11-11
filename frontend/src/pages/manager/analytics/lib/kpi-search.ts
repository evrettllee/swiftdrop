import type { AnalyticsKpis } from '@/shared/analytics-api';
import { formatCount } from '@/shared/lib/format';
import { KPI_TEXTS, MANAGER_ANALYTICS_TEXTS } from '../config/texts';
import type { KpiCard } from './kpi-card';
import { formatClock, ordersWord, searchTime, shareOf } from './numbers';

const EMPTY = MANAGER_ANALYTICS_TEXTS.EMPTY;

function searchValue(avgMin: number | null): { value: string; shortValue: string } {
  if (avgMin === null) {
    return { value: EMPTY, shortValue: EMPTY };
  }

  const time = searchTime(avgMin);
  const parts = [
    time.minutes > 0 ? KPI_TEXTS.minutes(String(time.minutes)) : null,
    time.seconds > 0 || time.minutes === 0 ? KPI_TEXTS.seconds(String(time.seconds)) : null,
  ];

  return { value: parts.filter((part) => part !== null).join(' '), shortValue: formatClock(time) };
}

export function searchCard({ courierSearch, delivered }: AnalyticsKpis): KpiCard {
  const { avgMin, manual } = courierSearch.current;
  const share = shareOf(manual, delivered.current.total);
  const shareText = share === null ? null : `${formatCount(share)}%`;
  const note = KPI_TEXTS.search(formatCount(manual), ordersWord(manual));

  return {
    id: 'courierSearch',
    title: KPI_TEXTS.SEARCH,
    shortTitle: KPI_TEXTS.SEARCH,
    ...searchValue(avgMin),
    note: shareText === null ? note : `${note} (${shareText})`,
    shortNote:
      shareText === null
        ? KPI_TEXTS.searchShort
        : `${KPI_TEXTS.searchShort}, ${KPI_TEXTS.manualShort(shareText)}`,
  };
}
