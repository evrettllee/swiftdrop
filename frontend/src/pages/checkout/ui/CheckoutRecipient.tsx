import { useId } from 'react';
import { NAME_MAX_LENGTH, PHONE_INPUT_MAX_LENGTH } from '@/shared/lib/person-validation';
import { Input } from '@/shared/ui/input';
import { CHECKOUT_FIELD } from '../config/checkout-form';
import { CHECKOUT_TEXTS } from '../config/texts';
import type { useCheckout } from '../model/useCheckout';

type CheckoutRecipientProps = {
  field: ReturnType<typeof useCheckout>['form']['field'];
};

export function CheckoutRecipient({ field }: CheckoutRecipientProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId} className="text-heading-sm font-semibold text-balance">
        {CHECKOUT_TEXTS.SECTION_RECIPIENT}
      </h2>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6">
        <Input
          label={CHECKOUT_TEXTS.RECIPIENT_NAME}
          maxLength={NAME_MAX_LENGTH}
          autoComplete="name"
          {...field(CHECKOUT_FIELD.RECIPIENT_NAME)}
        />
        <Input
          label={CHECKOUT_TEXTS.RECIPIENT_PHONE}
          type="tel"
          inputMode="tel"
          maxLength={PHONE_INPUT_MAX_LENGTH}
          autoComplete="tel"
          {...field(CHECKOUT_FIELD.RECIPIENT_PHONE)}
        />
      </div>
    </section>
  );
}
