import { PageTitle } from '@/shared/ui/page-title';
import { COURIER_WORK_TEXTS } from '../config/texts';
import { ConnectionAlert } from './ConnectionAlert';

export function CourierWorkPage() {
  return (
    <div className="flex max-w-276 flex-col gap-6 lg:gap-8">
      <PageTitle>{COURIER_WORK_TEXTS.PAGE_TITLE}</PageTitle>
      <ConnectionAlert />
    </div>
  );
}
