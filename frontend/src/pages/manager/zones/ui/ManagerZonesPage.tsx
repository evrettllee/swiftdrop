import { PageTitle } from '@/shared/ui/page-title';
import { MANAGER_ZONES_TEXTS } from '../config/texts';

export function ManagerZonesPage() {
  return (
    <PageTitle>
      <span className="lg:hidden">{MANAGER_ZONES_TEXTS.TITLE_SHORT}</span>
      <span className="hidden lg:inline">{MANAGER_ZONES_TEXTS.TITLE}</span>
    </PageTitle>
  );
}
