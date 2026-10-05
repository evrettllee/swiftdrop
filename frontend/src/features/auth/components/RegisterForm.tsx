import { useForm } from '../../../shared/lib/useForm';
import { Button } from '../../../shared/ui/Button';
import { Checkbox } from '../../../shared/ui/Checkbox';
import { InlineAlert } from '../../../shared/ui/InlineAlert';
import { Input } from '../../../shared/ui/Input';
import { AUTH_TEXTS, REGISTER_INITIAL_VALUES } from '../constants';
import { registerFormSchema } from '../schemas';
import { useAuthStore } from '../store';
import { LegalLinks } from './LegalLinks';
import { PasswordField } from './PasswordField';
import { PasswordRequirements } from './PasswordRequirements';

export function RegisterForm() {
  const signUp = useAuthStore((state) => state.signUp);
  const { formRef, values, field, checkbox, formError, isSubmitting, handleSubmit } = useForm({
    initialValues: REGISTER_INITIAL_VALUES,
    schema: registerFormSchema,
    // The password repeat and the consent (terms) are checked in the form and not sent to the backend.
    onSubmit: ({ firstName, lastName, email, phone, password }) =>
      signUp({ firstName, lastName, email, phone, password }),
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={AUTH_TEXTS.LABEL_FIRST_NAME}
          autoComplete="given-name"
          placeholder={AUTH_TEXTS.PLACEHOLDER_FIRST_NAME}
          {...field('firstName')}
        />
        <Input
          label={AUTH_TEXTS.LABEL_LAST_NAME}
          autoComplete="family-name"
          placeholder={AUTH_TEXTS.PLACEHOLDER_LAST_NAME}
          {...field('lastName')}
        />
      </div>
      <Input
        label={AUTH_TEXTS.LABEL_EMAIL}
        type="email"
        autoComplete="email"
        placeholder={AUTH_TEXTS.PLACEHOLDER_EMAIL}
        {...field('email')}
      />
      <Input
        label={AUTH_TEXTS.LABEL_PHONE}
        type="tel"
        autoComplete="tel"
        placeholder={AUTH_TEXTS.PLACEHOLDER_PHONE}
        hint={AUTH_TEXTS.PHONE_HINT}
        {...field('phone')}
      />
      <div className="flex flex-col gap-2">
        <PasswordField
          label={AUTH_TEXTS.LABEL_PASSWORD}
          autoComplete="new-password"
          {...field('password')}
        />
        <PasswordRequirements value={values.password ?? ''} />
      </div>
      <PasswordField
        label={AUTH_TEXTS.LABEL_CONFIRM_PASSWORD}
        autoComplete="new-password"
        {...field('confirmPassword')}
      />
      <Checkbox
        label={
          <>
            {AUTH_TEXTS.TERMS_ACCEPT} <LegalLinks />
          </>
        }
        {...checkbox('terms')}
      />
      {formError === null ? null : <InlineAlert variant="error">{formError}</InlineAlert>}
      <div className="pt-2">
        <Button type="submit" fullWidth loading={isSubmitting}>
          {isSubmitting ? AUTH_TEXTS.SUBMITTING_REGISTER : AUTH_TEXTS.SUBMIT_REGISTER}
        </Button>
      </div>
    </form>
  );
}
