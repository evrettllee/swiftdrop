import type { OrderDraftData, readOrderDraft } from '@/features/order-draft';
import { ROUTE_POINT } from '@/shared/config';
import { FULL_NAME_SEPARATOR } from '@/shared/lib/person-validation';
import { CHECKOUT_FIELD } from '../config/checkout-form';

type OrderDraft = ReturnType<typeof readOrderDraft>;

type FormValues = Record<string, string>;

// The signed-in client, who is the recipient unless the draft names another one.
type Client = { firstName: string; lastName: string; phone: string | null } | null;

// The draft of this form or of a repeated order brings the recipient and the apartments;
// otherwise the client is the recipient.
export function buildCheckoutInitialValues(draft: OrderDraft, client: Client): FormValues {
  return {
    [CHECKOUT_FIELD.RECIPIENT_NAME]:
      draft.recipient?.name ??
      (client === null ? '' : [client.firstName, client.lastName].join(FULL_NAME_SEPARATOR)),
    [CHECKOUT_FIELD.RECIPIENT_PHONE]: draft.recipient?.phone ?? client?.phone ?? '',
    [CHECKOUT_FIELD.PICKUP_APARTMENT]: draft.apartments?.[ROUTE_POINT.PICKUP] ?? '',
    [CHECKOUT_FIELD.DELIVERY_APARTMENT]: draft.apartments?.[ROUTE_POINT.DELIVERY] ?? '',
  };
}

// Everything typed on the page, as the fields keep it: a reload brings the form back from it.
export function buildCheckoutDraft(
  route: OrderDraftData['route'],
  packageValues: OrderDraftData['package'],
  values: FormValues,
): OrderDraftData {
  return {
    route,
    package: packageValues,
    apartments: {
      [ROUTE_POINT.PICKUP]: values[CHECKOUT_FIELD.PICKUP_APARTMENT] ?? '',
      [ROUTE_POINT.DELIVERY]: values[CHECKOUT_FIELD.DELIVERY_APARTMENT] ?? '',
    },
    recipient: {
      name: values[CHECKOUT_FIELD.RECIPIENT_NAME] ?? '',
      phone: values[CHECKOUT_FIELD.RECIPIENT_PHONE] ?? '',
    },
  };
}
