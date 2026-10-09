import { type FormEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useEstimate } from '@/features/estimate-price';
import { clearOrderDraft, readOrderDraft } from '@/features/order-draft';
import { usePackageForm } from '@/features/package-form';
import { useRouteAddresses } from '@/features/route-picker';
import { startPayment } from '@/shared/api';
import { ROUTE_POINT } from '@/shared/config';
import { useForm } from '@/shared/lib/forms';
import { FULL_NAME_SEPARATOR } from '@/shared/lib/person-validation';
import { getOrderPath } from '@/shared/routes';
import { useAuthStore } from '@/shared/session';
import { createOrder } from '../api/create-order';
import { CHECKOUT_FIELD } from '../config/checkout-form';
import { CHECKOUT_TEXTS } from '../config/texts';
import { buildOrderInput, getAddressError } from '../lib/order-input';
import { checkoutFormSchema, type CheckoutFormValues } from './checkout-form';
import { useDraftAutosave } from './useDraftAutosave';

// The order form: the route, the recipient and the package. "Go to payment" places the order,
// starts the payment and leaves for the payment page; if the payment does not start, the client
// goes to the page of the placed order, where it can be paid again.
export function useCheckout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  // The draft (from the landing, a repeated order or this form before a reload), if any; read
  // once, when the page opens.
  const [draft] = useState(readOrderDraft);
  const route = useRouteAddresses(draft.route ?? undefined);
  const packageForm = usePackageForm(draft.package ?? undefined);
  const estimate = useEstimate(route.pickup, route.delivery, packageForm.params);
  const [isAttempted, setIsAttempted] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  // Set at once when the order starts being placed and kept once it is placed: a second press (a
  // double click, Enter, or a click while the browser is still leaving for the payment) is ignored
  // before any render could mark the button busy. Cleared only when the order was not placed.
  const isPlacing = useRef(false);

  const pickup = { point: route.pickup, parts: route.parts[ROUTE_POINT.PICKUP] };
  const delivery = { point: route.delivery, parts: route.parts[ROUTE_POINT.DELIVERY] };

  async function placeOrder(values: CheckoutFormValues): Promise<void> {
    const input = buildOrderInput(pickup, delivery, packageForm.params, values);

    if (input === null) {
      return;
    }

    isPlacing.current = true;
    let order: Awaited<ReturnType<typeof createOrder>>;

    try {
      order = await createOrder(input);
    } catch (error) {
      // Nothing was placed, so the client may send the form again.
      isPlacing.current = false;
      throw error;
    }

    // The order is placed: the draft is not needed any more, whatever happens with the payment.
    // A save still waiting is dropped first, so it cannot bring the draft back after the clearing.
    stopAutosave();
    clearOrderDraft();

    try {
      const { checkoutUrl } = await startPayment(order.orderId);
      setIsLeaving(true);
      window.location.assign(checkoutUrl);
    } catch {
      void navigate(getOrderPath(order.orderId));
    }
  }

  // The draft of this form or of a repeated order brings the recipient and the apartments;
  // otherwise the client is the recipient.
  const form = useForm({
    initialValues: {
      [CHECKOUT_FIELD.RECIPIENT_NAME]:
        draft.recipient?.name ??
        (user === null ? '' : [user.firstName, user.lastName].join(FULL_NAME_SEPARATOR)),
      [CHECKOUT_FIELD.RECIPIENT_PHONE]: draft.recipient?.phone ?? user?.phone ?? '',
      [CHECKOUT_FIELD.PICKUP_APARTMENT]: draft.apartments?.[ROUTE_POINT.PICKUP] ?? '',
      [CHECKOUT_FIELD.DELIVERY_APARTMENT]: draft.apartments?.[ROUTE_POINT.DELIVERY] ?? '',
    },
    schema: checkoutFormSchema,
    onSubmit: placeOrder,
  });

  // Everything typed on the page goes to the draft, as the fields keep it.
  const stopAutosave = useDraftAutosave({
    route: {
      [ROUTE_POINT.PICKUP]: {
        point: route.pickup,
        text: route.texts[ROUTE_POINT.PICKUP],
        parts: route.parts[ROUTE_POINT.PICKUP],
      },
      [ROUTE_POINT.DELIVERY]: {
        point: route.delivery,
        text: route.texts[ROUTE_POINT.DELIVERY],
        parts: route.parts[ROUTE_POINT.DELIVERY],
      },
    },
    package: packageForm.values,
    apartments: {
      [ROUTE_POINT.PICKUP]: form.values[CHECKOUT_FIELD.PICKUP_APARTMENT] ?? '',
      [ROUTE_POINT.DELIVERY]: form.values[CHECKOUT_FIELD.DELIVERY_APARTMENT] ?? '',
    },
    recipient: {
      name: form.values[CHECKOUT_FIELD.RECIPIENT_NAME] ?? '',
      phone: form.values[CHECKOUT_FIELD.RECIPIENT_PHONE] ?? '',
    },
  });

  // The route and the package errors appear once the client tried to go to the payment.
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    if (isPlacing.current) {
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
    isSubmitting: form.isSubmitting || isLeaving,
    addressErrors: {
      [ROUTE_POINT.PICKUP]: isAttempted ? getAddressError(pickup) : null,
      [ROUTE_POINT.DELIVERY]: isAttempted ? getAddressError(delivery) : null,
    },
    packageError:
      isAttempted && packageForm.params === null ? CHECKOUT_TEXTS.PACKAGE_INVALID : null,
  };
}
