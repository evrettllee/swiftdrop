import { Divider } from '@/shared/ui/divider';
import { PageTitle } from '@/shared/ui/page-title';
import { CHECKOUT_FORM_ID } from '../config/checkout-form';
import { CHECKOUT_TEXTS } from '../config/texts';
import { useCheckout } from '../model/useCheckout';
import { CheckoutPackage } from './CheckoutPackage';
import { CheckoutRecipient } from './CheckoutRecipient';
import { CheckoutRoute } from './CheckoutRoute';
import { CheckoutSummary } from './CheckoutSummary';
import { MAIN_COLUMN_CLASS, SIDE_COLUMN_LAYOUT_CLASS } from '@/shared/config';

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
      <div className={SIDE_COLUMN_LAYOUT_CLASS}>
        <form
          id={CHECKOUT_FORM_ID}
          ref={formRef}
          noValidate
          onSubmit={handleSubmit}
          className={`${MAIN_COLUMN_CLASS} flex flex-col gap-6 lg:gap-8`}
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
