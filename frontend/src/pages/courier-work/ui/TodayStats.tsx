import { LIST_STATUS } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { Section } from '@/shared/ui/section';
import { Skeleton } from '@/shared/ui/skeleton';
import { TODAY_TEXTS } from '../config/texts';
import { buildTodayStatItems } from '../lib/today-stats';
import type { TodayStatsState } from '../model/useTodayStats';

type TodayStatsProps = {
  state: TodayStatsState;
  onRetry: () => void;
};

// The results of the day: two columns on a phone, four on the desktop.
export function TodayStats({ state, onRetry }: TodayStatsProps) {
  return (
    <Section title={TODAY_TEXTS.TITLE}>
      {state.status === LIST_STATUS.ERROR ? (
        <div className="flex flex-col items-start gap-4">
          <InlineAlert variant="error">{TODAY_TEXTS.LOAD_ERROR}</InlineAlert>
          <Button variant="secondary" onClick={onRetry}>
            {TODAY_TEXTS.RETRY}
          </Button>
        </div>
      ) : (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4 lg:gap-6">
          {buildTodayStatItems(state.stats).map((item) => (
            <div key={item.label} className="flex min-w-0 flex-col">
              <dt className="text-small text-fg-secondary">{item.label}</dt>
              <dd className="text-heading-md font-bold tabular-nums lg:text-heading-lg">
                {item.value ?? <Skeleton className="h-8 w-16 rounded-sm lg:h-10" />}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </Section>
  );
}
