import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import { useEstimate } from '@/features/estimate-price';
import { usePackageForm } from '@/features/package-form';
import { useRouteAddresses } from '@/features/route-picker';
import { startPayment } from '@/shared/api';
import { ROUTE_POINT } from '@/shared/config';
import { useForm } from '@/shared/lib/forms';
import { getOrderPath } from '@/shared/routes';
import { useAuthStore } from '@/shared/session';
import { createOrder } from '../api/create-order';
import { CHECKOUT_FIELD } from '../config/checkout-form';
import { CHECKOUT_TEXTS } from '../config/texts';
import { buildOrderInput, getAddressError } from '../lib/order-input';
import { checkoutFormSchema, type CheckoutFormValues } from './checkout-form';

// The order form: the route, the recipient and the package. "Go to payment" places the order,
// starts the payment and leaves for the payment page; if the payment does not start, the client
// goes to the page of the placed order, where it can be paid again.
export function useCheckout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const route = useRouteAddresses();
  const packageForm = usePackageForm();
  const estimate = useEstimate(route.pickup, route.delivery, packageForm.params);
  const [isAttempted, setIsAttempted] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const pickup = { point: route.pickup, parts: route.parts[ROUTE_POINT.PICKUP] };
  const delivery = { point: route.delivery, parts: route.parts[ROUTE_POINT.DELIVERY] };

  async function placeOrder(values: CheckoutFormValues): Promise<void> {
    const input = buildOrderInput(pickup, delivery, packageForm.params, values);

    if (input === null) {
      return;
    }

    const order = await createOrder(input);

    try {
      const { checkoutUrl } = await startPayment(order.orderId);
      setIsLeaving(true);
      window.location.assign(checkoutUrl);
    } catch {
      void navigate(getOrderPath(order.orderId));
    }
  }

  const form = useForm({
    initialValues: {
      [CHECKOUT_FIELD.RECIPIENT_NAME]: user === null ? '' : `${user.firstName} ${user.lastName}`,
      [CHECKOUT_FIELD.RECIPIENT_PHONE]: user?.phone ?? '',
      [CHECKOUT_FIELD.PICKUP_APARTMENT]: '',
      [CHECKOUT_FIELD.DELIVERY_APARTMENT]: '',
    },
    schema: checkoutFormSchema,
    onSubmit: placeOrder,
  });

  // The route and the package errors appear once the client tried to go to the payment.
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
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
