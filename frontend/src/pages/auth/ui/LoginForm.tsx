import { useForm } from '@/shared/lib/forms';
import { APP_ROUTES } from '@/shared/routes';
import { useAuthStore } from '@/shared/session';
import { Input } from '@/shared/ui/input';
import { TextLink } from '@/shared/ui/text-link';
import { AUTH_FIELD, LOGIN_INITIAL_VALUES } from '../config/forms';
import { AUTH_TEXTS } from '../config/texts';
import { loginFormSchema } from '../model/auth-forms';
import { FormFooter } from './FormFooter';
import { PasswordField } from './PasswordField';

export function LoginForm() {
  const signIn = useAuthStore((state) => state.signIn);
  const { formRef, field, formError, isSubmitting, handleSubmit } = useForm({
    initialValues: LOGIN_INITIAL_VALUES,
    schema: loginFormSchema,
    onSubmit: signIn,
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label={AUTH_TEXTS.LABEL_EMAIL}
        type="email"
        autoComplete="username"
        placeholder={AUTH_TEXTS.PLACEHOLDER_EMAIL}
        {...field(AUTH_FIELD.EMAIL)}
      />
      <div className="flex flex-col gap-2">
        <PasswordField
          label={AUTH_TEXTS.LABEL_PASSWORD}
          autoComplete="current-password"
          {...field(AUTH_FIELD.PASSWORD)}
        />
        <div className="flex justify-end">
          <TextLink to={APP_ROUTES.FORGOT_PASSWORD} variant="standalone">
            {AUTH_TEXTS.FORGOT_PASSWORD}
          </TextLink>
        </div>
      </div>
      <FormFooter
        formError={formError}
        isSubmitting={isSubmitting}
        submitLabel={AUTH_TEXTS.SUBMIT_LOGIN}
        submittingLabel={AUTH_TEXTS.SUBMITTING_LOGIN}
      />
    </form>
  );
}
