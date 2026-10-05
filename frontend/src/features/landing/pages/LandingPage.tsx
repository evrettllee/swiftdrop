import { SkipLink } from '../../../shared/ui/SkipLink';
import { AddressField } from '../../geocoding/components/AddressField';
import { EstimateResult } from '../../pricing/components/EstimateResult';
import { PackageFields } from '../../pricing/components/PackageFields';
import { useEstimate } from '../../pricing/lib/useEstimate';
import { usePackageForm } from '../../pricing/lib/usePackageForm';
import { LandingFooter } from '../components/LandingFooter';
import { LandingHeader } from '../components/LandingHeader';
import { RouteMap } from '../components/RouteMap';
import {
  ADDRESS_PLACEHOLDER,
  LANDING_SECTION_ID,
  LANDING_TEXTS,
  ROUTE_POINT_LABELS,
  ROUTE_POINT_ORDER,
} from '../constants';
import { useRouteAddresses } from '../lib/useRouteAddresses';

export function LandingPage() {
  const {
    pickup,
    delivery,
    target,
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
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <LandingHeader />
      <main
        id="main"
        className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-4 py-12 lg:px-12 lg:py-24"
      >
        {/* Temporary content: the calculator card replaces everything below the title. */}
        <h1
          id={LANDING_SECTION_ID.TOP}
          className="mx-auto max-w-4xl text-center text-display-sm font-bold lg:text-display"
        >
          {LANDING_TEXTS.HERO_TITLE}
        </h1>
        <div className="grid gap-4 lg:grid-cols-2">
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
        <div className="mx-auto flex w-full max-w-120 flex-col gap-6">
          <PackageFields form={packageForm} />
          <EstimateResult view={estimate} />
        </div>
        <RouteMap
          pickup={pickup}
          delivery={delivery}
          target={target}
          onPick={pickPoint}
          onMove={placePoint}
          className="h-96 lg:h-140"
        />
      </main>
      <LandingFooter />
    </div>
  );
}
