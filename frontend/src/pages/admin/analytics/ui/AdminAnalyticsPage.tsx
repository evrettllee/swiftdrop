import { PageTitle } from '@/shared/ui/page-title';
import { ADMIN_ANALYTICS_TEXTS } from '../config/texts';

export function AdminAnalyticsPage() {
  return (
    <header>
      <PageTitle>{ADMIN_ANALYTICS_TEXTS.TITLE}</PageTitle>
    </header>
  );
}
