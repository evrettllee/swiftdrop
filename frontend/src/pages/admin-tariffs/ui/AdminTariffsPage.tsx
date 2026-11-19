import { PageTitle } from '@/shared/ui/page-title';
import { ADMIN_TARIFFS_TEXTS } from '../config/texts';

export function AdminTariffsPage() {
  return (
    <header>
      <PageTitle>{ADMIN_TARIFFS_TEXTS.TITLE}</PageTitle>
    </header>
  );
}
