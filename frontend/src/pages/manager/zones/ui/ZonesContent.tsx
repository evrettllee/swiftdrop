import { MagnifyingGlassIcon, PentagonIcon } from '@phosphor-icons/react';
import type { ManagerZone } from '@/shared/staff-api';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { BlockLoader } from '@/shared/ui/page-loader';
import { MANAGER_ZONES_TEXTS as TEXTS } from '../config/texts';
import { ZoneCards } from './ZoneCards';
import { type ZoneListProps, ZonesTable } from './ZonesTable';

type ZonesContentProps = ZoneListProps & {
  all: readonly ManagerZone[] | null;
  search: string;
  isDesktop: boolean;
  isFailed: boolean;
  onRetry: () => void;
};

export function ZonesContent({
  all,
  search,
  isDesktop,
  isFailed,
  onRetry,
  ...list
}: ZonesContentProps) {
  if (all === null) {
    return isFailed ? (
      <div className="flex flex-col items-start gap-3">
        <InlineAlert variant="error" title={TEXTS.LOAD_FAILED_TITLE}>
          {TEXTS.LOAD_FAILED}
        </InlineAlert>
        <Button variant="secondary" onClick={onRetry}>
          {TEXTS.RETRY}
        </Button>
      </div>
    ) : (
      <BlockLoader className="py-24" />
    );
  }

  if (all.length === 0) {
    return <EmptyState icon={PentagonIcon} title={TEXTS.EMPTY_TITLE} text={TEXTS.EMPTY_TEXT} />;
  }

  if (list.zones.length === 0) {
    const text = search.trim() === '' ? TEXTS.NO_ACTIVE_SHOWN : TEXTS.bySearch(search.trim());

    return <EmptyState icon={MagnifyingGlassIcon} title={TEXTS.NOTHING_TITLE} text={text} />;
  }

  return isDesktop ? <ZonesTable {...list} /> : <ZoneCards {...list} />;
}
