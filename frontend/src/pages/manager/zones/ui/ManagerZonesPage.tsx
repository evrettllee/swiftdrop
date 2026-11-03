import { PlusIcon } from '@phosphor-icons/react';
import { DESKTOP_MEDIA_QUERY, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib/dom';
import { APP_ROUTES } from '@/shared/routes';
import { LinkButton } from '@/shared/ui/button';
import { PageTitle } from '@/shared/ui/page-title';
import { MANAGER_ZONES_TEXTS as TEXTS } from '../config/texts';
import { useZonesPage } from '../model/useZonesPage';
import { DisableZoneDialog } from './DisableZoneDialog';
import { ZoneEditDialog } from './ZoneEditDialog';
import { ZonesContent } from './ZonesContent';
import { ZonesMap } from './ZonesMap';
import { ZonesToolbar } from './ZonesToolbar';

export function ManagerZonesPage() {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const page = useZonesPage();
  const { toggle } = page;

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="flex items-center justify-between gap-4">
        <PageTitle>
          <span className="lg:hidden">{TEXTS.TITLE_SHORT}</span>
          <span className="hidden lg:inline">{TEXTS.TITLE}</span>
        </PageTitle>
        <LinkButton
          to={APP_ROUTES.MANAGER_ZONE_NEW}
          icon={<PlusIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
        >
          {TEXTS.NEW_ZONE}
        </LinkButton>
      </div>
      <ZonesToolbar
        search={page.search}
        isDisabledShown={page.isDisabledShown}
        onSearchChange={page.setSearch}
        onDisabledShownChange={page.setIsDisabledShown}
      />
      <ZonesMap
        zones={page.shown}
        cache={page.polygons.cache}
        isSettled={page.polygons.isSettled}
        selectedId={page.selectedId}
        onSelect={page.select}
      />
      <ZonesContent
        all={page.list.zones}
        zones={page.shown}
        search={page.search}
        isDesktop={isDesktop}
        isFailed={page.list.isFailed}
        selectedId={page.selectedId}
        isPending={toggle.isPending}
        onSelect={page.select}
        onToggle={toggle.request}
        onRetry={page.list.reload}
      />
      <DisableZoneDialog
        zone={toggle.confirming}
        onConfirm={toggle.confirm}
        onCancel={toggle.cancel}
      />
      <ZoneEditDialog zoneId={page.editedId} onClose={page.closeEditor} onSaved={page.onSaved} />
    </div>
  );
}
