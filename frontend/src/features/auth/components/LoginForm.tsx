import { APP_ROUTES } from '../../../shared/constants';
import { useForm } from '../../../shared/lib/useForm';
import { Button } from '../../../shared/ui/Button';
import { InlineAlert } from '../../../shared/ui/InlineAlert';
import { Input } from '../../../shared/ui/Input';
import { TextLink } from '../../../shared/ui/TextLink';
import { AUTH_FIELD, AUTH_TEXTS, LOGIN_INITIAL_VALUES } from '../constants';
import { loginFormSchema } from '../schemas';
import { useAuthStore } from '../store';
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
      {formError === null ? null : <InlineAlert variant="error">{formError}</InlineAlert>}
      <div className="pt-2">
        <Button type="submit" fullWidth loading={isSubmitting}>
          {isSubmitting ? AUTH_TEXTS.SUBMITTING_LOGIN : AUTH_TEXTS.SUBMIT_LOGIN}
        </Button>
      </div>
    </form>
  );
}
