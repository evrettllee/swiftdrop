import { Divider } from '@/shared/ui/divider';
import { PageTitle } from '@/shared/ui/page-title';
import { CHECKOUT_FORM_ID } from '../config/checkout-form';
import { CHECKOUT_TEXTS } from '../config/texts';
import { useCheckout } from '../model/useCheckout';
import { CheckoutPackage } from './CheckoutPackage';
import { CheckoutRecipient } from './CheckoutRecipient';
import { CheckoutRoute } from './CheckoutRoute';
import { CheckoutSummary } from './CheckoutSummary';

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
      <PageTitle>{CHECKOUT_TEXTS.PAGE_TITLE}</PageTitle>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-12">
        <form
          id={CHECKOUT_FORM_ID}
          ref={formRef}
          noValidate
          onSubmit={handleSubmit}
          className="flex min-w-0 flex-col gap-6 lg:gap-8"
        >
          <CheckoutRoute route={route} field={field} addressErrors={addressErrors} />
          <Divider />
          <CheckoutRecipient field={field} />
          <Divider />
          <CheckoutPackage form={packageForm} error={packageError} />
        </form>
        <CheckoutSummary
          estimate={estimate}
          formError={formError}
          isSubmitting={isSubmitting}
          formId={CHECKOUT_FORM_ID}
        />
      </div>
    </div>
  );
}
