import { useId } from 'react';
import {
  ADDRESS_PLACEHOLDER,
  APARTMENT_MAX_LENGTH,
  ROUTE_POINT,
  ROUTE_POINT_LABELS,
  ROUTE_POINT_ORDER,
  type RoutePointKind,
} from '@/shared/config';
import { AddressField } from '@/shared/ui/address-field';
import { Input } from '@/shared/ui/input';
import { RouteMap } from '@/shared/ui/route-map';
import { RoutePointMark } from '@/shared/ui/route-point-mark';
import { Section } from '@/shared/ui/section';
import { CHECKOUT_FIELD } from '../config/checkout-form';
import { CHECKOUT_TEXTS } from '../config/texts';
import type { useCheckout } from '../model/useCheckout';

const APARTMENT_FIELD = {
  [ROUTE_POINT.PICKUP]: CHECKOUT_FIELD.PICKUP_APARTMENT,
  [ROUTE_POINT.DELIVERY]: CHECKOUT_FIELD.DELIVERY_APARTMENT,
} as const;

type Checkout = ReturnType<typeof useCheckout>;

type CheckoutRouteProps = {
  route: Checkout['route'];
  field: Checkout['form']['field'];
  addressErrors: Checkout['addressErrors'];
};

// The map and a block for each of the two points.
export function CheckoutRoute({ route, field, addressErrors }: CheckoutRouteProps) {
  return (
    <Section title={CHECKOUT_TEXTS.SECTION_ROUTE}>
      <RouteMap
        pickup={route.pickup}
        delivery={route.delivery}
        hint={route.hint}
        onPick={route.pickPoint}
        onMove={route.placePoint}
        onRemove={(kind) => route.changeText(kind, '')}
        className="h-50 lg:h-55"
      />
      <div className="flex flex-col gap-4">
        {ROUTE_POINT_ORDER.map((kind) => (
          <RoutePointBlock
            key={kind}
            kind={kind}
            route={route}
            field={field}
            error={addressErrors[kind] ?? undefined}
          />
        ))}
      </div>
    </Section>
  );
}

type RoutePointBlockProps = {
  kind: RoutePointKind;
  route: Checkout['route'];
  field: Checkout['form']['field'];
  error: string | undefined;
};

// One point of the route: its mark and name, the address and the apartment next to it (under it
// on a phone).
function RoutePointBlock({ kind, route, field, error }: RoutePointBlockProps) {
  const titleId = useId();

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <h3 id={titleId} className="flex items-center gap-2 text-body font-semibold">
        <RoutePointMark kind={kind} />
        {ROUTE_POINT_LABELS[kind]}
      </h3>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_160px] lg:gap-6">
        <AddressField
          label={CHECKOUT_TEXTS.ADDRESS}
          placeholder={ADDRESS_PLACEHOLDER}
          value={route.texts[kind]}
          onChange={(text) => route.changeText(kind, text)}
          onSelect={(suggestion) => route.selectSuggestion(kind, suggestion)}
          onFocus={() => route.setTarget(kind)}
          isLookingUp={route.lookingUp[kind]}
          error={error}
        />
        <Input
          label={CHECKOUT_TEXTS.APARTMENT}
          placeholder={CHECKOUT_TEXTS.APARTMENT_PLACEHOLDER}
          maxLength={APARTMENT_MAX_LENGTH}
          autoComplete="off"
          {...field(APARTMENT_FIELD[kind])}
        />
      </div>
    </div>
  );
}
