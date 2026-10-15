import { type FormEvent, useState } from 'react';
import { useEstimate } from '@/features/estimate-price';
import { readOrderDraft } from '@/features/order-draft';
import { usePackageForm } from '@/features/package-form';
import { useRouteAddresses } from '@/features/route-picker';
import { ROUTE_POINT } from '@/shared/config';
import { useForm } from '@/shared/lib/forms';
import { useAuthStore } from '@/shared/session';
import { CHECKOUT_TEXTS } from '../config/texts';
import { buildCheckoutDraft, buildCheckoutInitialValues } from '../lib/checkout-draft';
import { buildOrderInput, getAddressError } from '../lib/order-input';
import { checkoutFormSchema, type CheckoutFormValues } from './checkout-form';
import { useDraftAutosave } from './useDraftAutosave';
import { usePlaceOrder } from './usePlaceOrder';

// The order form: the route, the recipient and the package. "Go to payment" places the order and
// leaves for the payment page (usePlaceOrder).
export function useCheckout() {
  const user = useAuthStore((state) => state.user);
  // The draft (from the landing, a repeated order or this form before a reload), if any; read
  // once, when the page opens.
  const [draft] = useState(readOrderDraft);
  const route = useRouteAddresses(draft.route ?? undefined);
  const packageForm = usePackageForm(draft.package ?? undefined);
  const estimate = useEstimate(route.pickup, route.delivery, packageForm.params);
  const [isAttempted, setIsAttempted] = useState(false);
  const placement = usePlaceOrder();

  const pickup = { point: route.pickup, parts: route.parts[ROUTE_POINT.PICKUP] };
  const delivery = { point: route.delivery, parts: route.parts[ROUTE_POINT.DELIVERY] };

  async function submitOrder(values: CheckoutFormValues): Promise<void> {
    const input = buildOrderInput(pickup, delivery, packageForm.params, values);

    if (input !== null) {
      // A save still waiting is dropped before the draft is cleared, so it cannot bring it back.
      await placement.placeOrder(input, stopAutosave);
    }
  }

  const form = useForm({
    initialValues: buildCheckoutInitialValues(draft, user),
    schema: checkoutFormSchema,
    onSubmit: submitOrder,
  });

  const stopAutosave = useDraftAutosave(
    buildCheckoutDraft(route.values, packageForm.values, form.values),
  );

  // The route and the package errors appear once the client tried to go to the payment.
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    if (placement.isPlacing.current) {
      event.preventDefault();
      return;
    }

    setIsAttempted(true);
    form.handleSubmit(event);
  }

  return {
    route,
    packageForm,
    estimate,
    form,
    handleSubmit,
    isSubmitting: form.isSubmitting || placement.isLeaving,
    addressErrors: {
      [ROUTE_POINT.PICKUP]: isAttempted ? getAddressError(pickup) : null,
      [ROUTE_POINT.DELIVERY]: isAttempted ? getAddressError(delivery) : null,
    },
    packageError:
      isAttempted && packageForm.params === null ? CHECKOUT_TEXTS.PACKAGE_INVALID : null,
  };
}
