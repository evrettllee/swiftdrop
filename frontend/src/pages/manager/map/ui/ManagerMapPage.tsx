import { DESKTOP_MEDIA_QUERY } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib/dom';
import { BlockLoader } from '@/shared/ui/page-loader';
import { PageTitle } from '@/shared/ui/page-title';
import { RouteOverlay } from '@/shared/ui/route-map';
import { CARD_TEXTS, MANAGER_MAP_TEXTS as TEXTS } from '../config/texts';
import { useManagerMap } from '../model/useManagerMap';
import { useSelectedOrder } from '../model/useSelectedOrder';
import { CourierCard } from './CourierCard';
import { CouriersList } from './CouriersList';
import { CouriersMapView } from './CouriersMapView';
import { MapLoadFailed } from './MapLoadFailed';
import { MapPageLayout } from './MapPageLayout';
import { MapToolbar } from './MapToolbar';

export function ManagerMapPage() {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const page = useManagerMap();
  const { params, selected, select } = page;
  const order = useSelectedOrder(selected?.activeOrder?.orderId ?? null, page.selectedPoint);
  const card =
    selected === null ? null : (
      <CourierCard
        courier={selected}
        now={page.now}
        eta={order?.estimatedDeliveryAt ?? null}
        onClose={() => select(null)}
      />
    );

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageTitle>{TEXTS.TITLE}</PageTitle>
      <MapPageLayout
        isDesktop={isDesktop}
        toolbar={
          <MapToolbar
            searchText={params.searchText}
            chips={page.chips}
            filter={params.values.state}
            onSearchChange={params.setSearchText}
            onFilterChange={(state) => params.update({ state })}
          />
        }
        failure={page.isFailed ? <MapLoadFailed onRetry={page.reload} /> : null}
        map={
          <CouriersMapView
            couriers={page.shown}
            fitPoints={page.fitPoints}
            selected={selected}
            card={isDesktop ? card : null}
            routeLayer={
              order === null ? null : (
                <RouteOverlay pickup={order.pickup} delivery={order.delivery} route={order.route} />
              )
            }
            className="h-90 lg:h-full"
            onSelect={select}
          />
        }
        card={
          selected === null || isDesktop
            ? null
            : { label: CARD_TEXTS.courierLabel(selected.name), content: card }
        }
        list={
          page.hasData ? (
            <CouriersList
              couriers={page.shown}
              now={page.now}
              selectedId={page.selectedId}
              search={page.query.search}
              filter={params.values.state}
              isLoading={page.isLoading}
              onSelect={select}
            />
          ) : (
            <BlockLoader className="py-24" />
          )
        }
      />
    </div>
  );
}
