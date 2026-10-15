import { PageTitle } from '@/shared/ui/page-title';
import { COURIER_HISTORY_TEXTS } from '../config/texts';

export function CourierHistoryPage() {
  return (
    <div className="flex max-w-276 flex-col gap-6 lg:gap-8">
      <PageTitle>{COURIER_HISTORY_TEXTS.PAGE_TITLE}</PageTitle>
    </div>
  );
}
