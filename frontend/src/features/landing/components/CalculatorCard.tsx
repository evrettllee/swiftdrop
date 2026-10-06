import { useId } from 'react';
import { APP_ROUTES } from '../../../shared/constants/routes';
import { LinkButton } from '../../../shared/ui/Button';
import { AddressField } from '../../geocoding/components/AddressField';
import { EstimateResult } from '../../pricing/components/EstimateResult';
import { PackageFields } from '../../pricing/components/PackageFields';
import { useEstimate } from '../../pricing/lib/useEstimate';
import { usePackageForm } from '../../pricing/lib/usePackageForm';
import { LANDING_SCROLL_OFFSET_CLASS } from '../constants/layout';
import { LANDING_SECTION_ID } from '../constants/navigation';
import {
  ADDRESS_PLACEHOLDER,
  ROUTE_POINT_LABELS,
  ROUTE_POINT_ORDER,
} from '../constants/route-points';
import { LANDING_TEXTS } from '../constants/texts';
import { useRouteAddresses } from '../lib/useRouteAddresses';
import { RouteMap } from './RouteMap';

// The map on the left, the form with the price on the right; on a phone the map goes first.
export function CalculatorCard() {
  const titleId = useId();
  const {
    pickup,
    delivery,
    hint,
    texts,
    setTarget,
    changeText,
    selectSuggestion,
    placePoint,
    pickPoint,
  } = useRouteAddresses();
  const packageForm = usePackageForm();
  const estimate = useEstimate(pickup, delivery, packageForm.params);

  return (
    <section
      id={LANDING_SECTION_ID.CALCULATOR}
      aria-labelledby={titleId}
      className={`${LANDING_SCROLL_OFFSET_CLASS} rounded-xl border border-border bg-surface p-4 shadow-lg lg:p-6`}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <RouteMap
          pickup={pickup}
          delivery={delivery}
          hint={hint}
          onPick={pickPoint}
          onMove={placePoint}
          onRemove={(kind) => changeText(kind, '')}
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
                value={texts[kind]}
                onChange={(text) => changeText(kind, text)}
                onSelect={(suggestion) => selectSuggestion(kind, suggestion)}
                onFocus={() => setTarget(kind)}
              />
            ))}
          </div>
          <PackageFields form={packageForm} />
          <EstimateResult view={estimate} />
          <div className="flex flex-col gap-2">
            <LinkButton to={APP_ROUTES.AUTH} fullWidth>
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
