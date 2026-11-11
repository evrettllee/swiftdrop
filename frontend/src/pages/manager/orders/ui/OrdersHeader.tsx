import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import type { ManagerOrdersListQuery } from '@/shared/staff-api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { OutlineIconButton } from '@/shared/ui/icon-button';
import { PageTitle } from '@/shared/ui/page-title';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';
import { ExportDialog } from './ExportDialog';

type OrdersHeaderProps = {
  isDesktop: boolean;
  query: ManagerOrdersListQuery;
  count: number | null;
  scope: readonly string[];
};

export function OrdersHeader({ isDesktop, query, count, scope }: OrdersHeaderProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const icon = (
    <DownloadSimpleIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
  );

  return (
    <header className="flex items-center justify-between gap-4">
      <PageTitle>{MANAGER_ORDERS_TEXTS.TITLE}</PageTitle>
      {isDesktop ? (
        <Button variant="secondary" icon={icon} onClick={() => setIsExportOpen(true)}>
          {MANAGER_ORDERS_TEXTS.EXPORT}
        </Button>
      ) : (
        <OutlineIconButton
          aria-label={MANAGER_ORDERS_TEXTS.EXPORT}
          onClick={() => setIsExportOpen(true)}
        >
          {icon}
        </OutlineIconButton>
      )}
      <ExportDialog
        key={isExportOpen ? 'open' : 'closed'}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        query={query}
        count={count}
        scope={scope}
      />
    </header>
  );
}
