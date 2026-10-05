import { useState } from 'react';
import { SkipLink } from '../../../shared/ui/SkipLink';
import { AddressField } from '../../geocoding/components/AddressField';
import type { AddressSuggestion } from '../../geocoding/types';
import { LandingFooter } from '../components/LandingFooter';
import { LandingHeader } from '../components/LandingHeader';
import { RouteMap } from '../components/RouteMap';
import { LANDING_SECTION_ID, LANDING_TEXTS } from '../constants';
import { useRoutePoints } from '../lib/useRoutePoints';

export function LandingPage() {
  const { pickup, delivery, target, setPoint, pickPoint } = useRoutePoints();
  const [addressText, setAddressText] = useState('');
  const [chosen, setChosen] = useState<AddressSuggestion | null>(null);

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
        <div className="mx-auto w-full max-w-120">
          <AddressField
            label="Откуда"
            placeholder="Начните вводить адрес"
            value={addressText}
            onChange={setAddressText}
            onSelect={(suggestion) => {
              setAddressText(suggestion.name);
              setChosen(suggestion);
            }}
          />
        </div>
        <p className="text-small text-fg-secondary">{JSON.stringify(chosen)}</p>
        <RouteMap
          pickup={pickup}
          delivery={delivery}
          target={target}
          onPick={pickPoint}
          onMove={setPoint}
          className="h-96 lg:h-140"
        />
      </main>
      <LandingFooter />
    </div>
  );
}
