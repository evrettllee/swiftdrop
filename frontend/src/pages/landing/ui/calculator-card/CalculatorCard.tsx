import { useId } from 'react';
import { useEstimate } from '@/features/estimate-price';
import { PackageFields, usePackageForm } from '@/features/package-form';
import { useRouteAddresses } from '@/features/route-picker';
import { ADDRESS_PLACEHOLDER, ROUTE_POINT_LABELS, ROUTE_POINT_ORDER } from '@/shared/config';
import { AddressField } from '@/shared/ui/address-field';
import { LinkButton } from '@/shared/ui/button';
import { RouteMap } from '@/shared/ui/route-map';
import { LANDING_SCROLL_OFFSET_CLASS } from '../../config/layout';
import { LANDING_SECTION_ID } from '../../config/navigation';
import { LANDING_TEXTS } from '../../config/texts';
import { useOrderLink } from '../../model/useOrderLink';
import { EstimateResult } from './EstimateResult';

// The map on the left, the form with the price on the right; on a phone the map goes first.
export function CalculatorCard() {
  const titleId = useId();
  const route = useRouteAddresses();
  const packageForm = usePackageForm();
  const estimate = useEstimate(route.pickup, route.delivery, packageForm.params);
  const orderLink = useOrderLink();

  // The order form starts from what is entered here, even if it is unfinished.
  function handleOrder(): void {
    orderLink.startOrder({ route: route.values, package: packageForm.values });
  }

  return (
    <section
      id={LANDING_SECTION_ID.CALCULATOR}
      aria-labelledby={titleId}
      className={`${LANDING_SCROLL_OFFSET_CLASS} rounded-xl border border-border bg-surface p-4 shadow-lg lg:p-6`}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <RouteMap
          pickup={route.pickup}
          delivery={route.delivery}
          hint={route.hint}
          onPick={route.pickPoint}
          onMove={route.placePoint}
          onRemove={(kind) => route.changeText(kind, '')}
          className="h-65 lg:h-auto lg:min-h-140"
        />
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-heading-md font-semibold">
              {LANDING_TEXTS.CALC_TITLE}
            </h2>
            <p className="text-small text-fg-secondary">{LANDING_TEXTS.CALC_SUBTITLE}</p>
          </div>
          <div className="flex flex-col gap-4">
            {ROUTE_POINT_ORDER.map((kind) => (
              <AddressField
                key={kind}
                label={ROUTE_POINT_LABELS[kind]}
                placeholder={ADDRESS_PLACEHOLDER}
                value={route.texts[kind]}
                onChange={(text) => route.changeText(kind, text)}
                onSelect={(suggestion) => route.selectSuggestion(kind, suggestion)}
                onFocus={() => route.setTarget(kind)}
                isLookingUp={route.lookingUp[kind]}
              />
            ))}
          </div>
          <PackageFields form={packageForm} />
          <EstimateResult view={estimate} />
          <div className="flex flex-col gap-2">
            <LinkButton to={orderLink.to} onClick={handleOrder} fullWidth>
              {LANDING_TEXTS.ORDER}
            </LinkButton>
            <p className="text-center text-caption text-fg-secondary">
              {LANDING_TEXTS.CALC_CAPTION}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
