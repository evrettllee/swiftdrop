import { formatDistanceKm } from '@/entities/price';
import type { CourierTodayStats } from '@/shared/api';
import { APP_LOCALE } from '@/shared/config';
import { RATING_FRACTION_DIGITS } from '../config/stats';
import { TODAY_TEXTS } from '../config/texts';

const countFormat = new Intl.NumberFormat(APP_LOCALE);

const ratingFormat = new Intl.NumberFormat(APP_LOCALE, {
  minimumFractionDigits: RATING_FRACTION_DIGITS,
  maximumFractionDigits: RATING_FRACTION_DIGITS,
});

export type TodayStatItem = {
  label: string;
  // Null while the results are loading.
  value: string | null;
};

// The four results of the day as the page shows them: "3", "24,6 км", "4 из 5", "4,9" or "—".
export function buildTodayStatItems(stats: CourierTodayStats | null): TodayStatItem[] {
  return [
    {
      label: TODAY_TEXTS.DELIVERED,
      value: stats === null ? null : countFormat.format(stats.delivered),
    },
    {
      label: TODAY_TEXTS.DISTANCE,
      value: stats === null ? null : formatDistanceKm(stats.distanceKm),
    },
    {
      label: TODAY_TEXTS.OFFERS,
      value:
        stats === null
          ? null
          : TODAY_TEXTS.offers(
              countFormat.format(stats.offersAccepted),
              countFormat.format(stats.offersReceived),
            ),
    },
    {
      label: TODAY_TEXTS.RATING,
      value:
        stats === null
          ? null
          : stats.rating === null
            ? TODAY_TEXTS.NO_VALUE
            : ratingFormat.format(stats.rating),
    },
  ];
}
