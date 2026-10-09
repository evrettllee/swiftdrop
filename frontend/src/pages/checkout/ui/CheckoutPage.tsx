import { CHECKOUT_TEXTS } from '../config/texts';
import { useCheckout } from '../model/useCheckout';
import { CheckoutPackage } from './CheckoutPackage';
import { CheckoutRecipient } from './CheckoutRecipient';
import { CheckoutRoute } from './CheckoutRoute';
import { CheckoutSummary } from './CheckoutSummary';

// The button of the summary panel sits outside the form and is tied to it by this id.
const FORM_ID = 'checkout-form';
const DIVIDER = <hr className="border-border" />;

export function CheckoutPage() {
  const {
    route,
    packageForm,
    estimate,
    form,
    handleSubmit,
    isSubmitting,
    addressErrors,
    packageError,
  } = useCheckout();
  const { formRef, field, formError } = form;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <h1 className="text-heading-md font-bold text-balance lg:text-heading-lg">
        {CHECKOUT_TEXTS.PAGE_TITLE}
      </h1>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-12">
        <form
          id={FORM_ID}
          ref={formRef}
          noValidate
          onSubmit={handleSubmit}
          className="flex min-w-0 flex-col gap-6 lg:gap-8"
        >
          <CheckoutRoute route={route} field={field} addressErrors={addressErrors} />
          {DIVIDER}
          <CheckoutRecipient field={field} />
          {DIVIDER}
          <CheckoutPackage form={packageForm} error={packageError} />
        </form>
        <CheckoutSummary
          estimate={estimate}
          formError={formError}
          isSubmitting={isSubmitting}
          formId={FORM_ID}
        />
      </div>
    </div>
  );
}
