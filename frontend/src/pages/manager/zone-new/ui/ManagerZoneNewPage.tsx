import {
  DRAW_TOOL,
  DrawPageLayout,
  DrawToolbar,
  LeaveDialog,
  ZoneDrawMap,
} from '@/features/zone-draw';
import { DESKTOP_MEDIA_QUERY } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib/dom';
import { APP_ROUTES } from '@/shared/routes';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { PageTitle } from '@/shared/ui/page-title';
import { MANAGER_ZONE_NEW_TEXTS as TEXTS } from '../config/texts';
import { useNewZone } from '../model/useNewZone';
import { NewZonePanel } from './NewZonePanel';

const TOOLS = Object.values(DRAW_TOOL);

export function ManagerZoneNewPage() {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const page = useNewZone();
  const { draw, guard, saving } = page;

  return (
    <>
      <DrawPageLayout
        header={
          <header className="flex flex-col gap-2">
            <Breadcrumbs
              label={TEXTS.NAV_LABEL}
              parent={{ label: TEXTS.PARENT, to: APP_ROUTES.MANAGER_ZONES }}
              current={TEXTS.TITLE}
            />
            <PageTitle>{TEXTS.TITLE}</PageTitle>
          </header>
        }
        toolbar={<DrawToolbar draw={draw} isColumn={false} tools={TOOLS} />}
        alert={
          saving.polygonError === null ? null : (
            <InlineAlert variant="error" title={saving.polygonError} />
          )
        }
        map={
          <ZoneDrawMap
            draw={draw}
            initial={null}
            neighbors={page.neighbors.neighbors}
            fitPoints={page.neighbors.points}
            isDesktop={isDesktop}
            hasToolbar
            className="h-100 lg:h-160"
          />
        }
        panel={<NewZonePanel page={page} />}
      />
      <LeaveDialog isOpen={guard.isBlocked} onLeave={guard.leave} onStay={guard.stay} />
    </>
  );
}
