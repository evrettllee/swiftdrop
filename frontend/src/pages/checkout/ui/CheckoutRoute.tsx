import { Fragment, useId } from 'react';
import {
  ADDRESS_PLACEHOLDER,
  ROUTE_POINT,
  ROUTE_POINT_LABELS,
  ROUTE_POINT_ORDER,
} from '@/shared/config';
import { AddressField } from '@/shared/ui/address-field';
import { Input } from '@/shared/ui/input';
import { RouteMap } from '@/shared/ui/route-map';
import { RoutePointMark } from '@/shared/ui/route-point-mark';
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

// The map and the two addresses; each address has its apartment next to it (under it on a phone).
export function CheckoutRoute({ route, field, addressErrors }: CheckoutRouteProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId} className="text-heading-sm font-semibold text-balance">
        {CHECKOUT_TEXTS.SECTION_ROUTE}
      </h2>
      <RouteMap
        pickup={route.pickup}
        delivery={route.delivery}
        hint={route.hint}
        onPick={route.pickPoint}
        onMove={route.placePoint}
        onRemove={(kind) => route.changeText(kind, '')}
        className="h-50 lg:h-55"
      />
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_160px] lg:gap-6">
        {ROUTE_POINT_ORDER.map((kind) => (
          <Fragment key={kind}>
            <AddressField
              label={ROUTE_POINT_LABELS[kind]}
              labelAdornment={<RoutePointMark kind={kind} />}
              placeholder={ADDRESS_PLACEHOLDER}
              value={route.texts[kind]}
              onChange={(text) => route.changeText(kind, text)}
              onSelect={(suggestion) => route.selectSuggestion(kind, suggestion)}
              onFocus={() => route.setTarget(kind)}
              isLookingUp={route.lookingUp[kind]}
              error={addressErrors[kind] ?? undefined}
            />
            <Input
              label={CHECKOUT_TEXTS.APARTMENT}
              placeholder={CHECKOUT_TEXTS.APARTMENT_PLACEHOLDER}
              autoComplete="off"
              {...field(APARTMENT_FIELD[kind])}
            />
          </Fragment>
        ))}
      </div>
    </section>
  );
}
