import { useParams } from 'react-router';
import { DETAILS_STATUS } from '@/entities/zone';
import { DrawPageLayout, DrawToolbar, LeaveDialog, ZoneDrawMap } from '@/features/zone-draw';
import { DESKTOP_MEDIA_QUERY } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib/dom';
import { APP_ROUTES, ZONE_ID_PARAM } from '@/shared/routes';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { BlockLoader } from '@/shared/ui/page-loader';
import { PageTitle } from '@/shared/ui/page-title';
import { MANAGER_ZONE_CONTOUR_TEXTS as TEXTS } from '../config/texts';
import { useZoneContour } from '../model/useZoneContour';
import { ContourPanel } from './ContourPanel';

const ZONE_ID_PATTERN = /^[1-9]\d{0,9}$/;

function parseZoneId(raw: string | undefined): number | null {
  return raw !== undefined && ZONE_ID_PATTERN.test(raw) ? Number(raw) : null;
}

export function ManagerZoneContourPage() {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const page = useZoneContour(parseZoneId(useParams()[ZONE_ID_PARAM]));
  const { draw, guard, saving, details } = page;
  const header = (
    <header className="flex flex-col gap-2">
      <Breadcrumbs
        label={TEXTS.NAV_LABEL}
        parent={{ label: TEXTS.PARENT, to: APP_ROUTES.MANAGER_ZONES }}
        current={TEXTS.TITLE}
      />
      <PageTitle>{TEXTS.TITLE}</PageTitle>
    </header>
  );

  if (page.initial === null) {
    return (
      <div className="flex flex-col gap-4 lg:gap-6">
        {header}
        {details.status === DETAILS_STATUS.NOT_FOUND ? (
          <InlineAlert variant="warning" title={TEXTS.NOT_FOUND}>
            {TEXTS.NOT_FOUND_TEXT}
          </InlineAlert>
        ) : null}
        {details.status === DETAILS_STATUS.FAILED ? (
          <div className="flex flex-col items-start gap-2">
            <InlineAlert variant="error" title={TEXTS.LOAD_FAILED} />
            <Button variant="secondary" onClick={details.reload}>
              {TEXTS.RETRY}
            </Button>
          </div>
        ) : null}
        {details.status === DETAILS_STATUS.LOADING ? (
          <BlockLoader text={TEXTS.LOADING} className="py-24" />
        ) : null}
      </div>
    );
  }

  return (
    <>
      <DrawPageLayout
        header={header}
        toolbar={<DrawToolbar draw={draw} isColumn={false} />}
        alert={
          saving.polygonError === null ? null : (
            <InlineAlert variant="error" title={saving.polygonError} />
          )
        }
        map={
          <ZoneDrawMap
            draw={draw}
            initial={page.initial}
            neighbors={page.neighbors.neighbors}
            fitPoints={page.ring}
            isDesktop={isDesktop}
            hasToolbar
            className="h-100 lg:h-160"
          />
        }
        panel={<ContourPanel page={page} />}
      />
      <LeaveDialog isOpen={guard.isBlocked} onLeave={guard.leave} onStay={guard.stay} />
    </>
  );
}
