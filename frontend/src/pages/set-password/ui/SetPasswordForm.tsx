import { useNavigate } from 'react-router';
import { PASSWORD_TEXTS, PasswordField, PasswordRequirements } from '@/features/password-fields';
import { ApiError, HTTP_STATUS } from '@/shared/api';
import { useForm } from '@/shared/lib/forms';
import { ROLE_HOME_ROUTE } from '@/shared/routes';
import { type PasswordLink, useAuthStore } from '@/shared/session';
import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { SET_PASSWORD_FIELD, SET_PASSWORD_INITIAL_VALUES } from '../config/forms';
import { SET_PASSWORD_TEXTS } from '../config/texts';
import { getExplanation } from '../lib/explanation';
import { setPasswordFormSchema } from '../model/set-password-form';

type SetPasswordFormProps = {
  token: string;
  link: PasswordLink;
  onInvalid: () => void;
};

export function SetPasswordForm({ token, link, onInvalid }: SetPasswordFormProps) {
  const navigate = useNavigate();
  const signInByPasswordLink = useAuthStore((state) => state.signInByPasswordLink);
  const { formRef, values, field, formError, isSubmitting, handleSubmit } = useForm({
    initialValues: SET_PASSWORD_INITIAL_VALUES,
    schema: setPasswordFormSchema,
    onSubmit: async ({ password }) => {
      try {
        const user = await signInByPasswordLink(token, password);
        await navigate(ROLE_HOME_ROUTE[user.role], { replace: true });
      } catch (error) {
        if (error instanceof ApiError && error.status === HTTP_STATUS.NOT_FOUND) {
          onInvalid();
        } else {
          throw error;
        }
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-heading-md font-semibold text-balance">{SET_PASSWORD_TEXTS.TITLE}</h1>
        <p className="text-body text-pretty text-fg-secondary">{getExplanation(link)}</p>
      </div>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="mb-2 flex min-h-11.5 items-center justify-between gap-4 rounded-md border border-border px-4 text-small">
          <span className="text-fg-secondary">{SET_PASSWORD_TEXTS.LOGIN}</span>
          <span className="min-w-0 truncate font-semibold">{link.email}</span>
        </div>
        <div className="flex flex-col gap-2">
          <PasswordField
            label={PASSWORD_TEXTS.LABEL}
            autoComplete="new-password"
            {...field(SET_PASSWORD_FIELD.PASSWORD)}
          />
          <PasswordRequirements value={values[SET_PASSWORD_FIELD.PASSWORD] ?? ''} />
        </div>
        <PasswordField
          label={PASSWORD_TEXTS.LABEL_CONFIRM}
          autoComplete="new-password"
          {...field(SET_PASSWORD_FIELD.CONFIRM_PASSWORD)}
        />
        {formError === null ? null : <InlineAlert variant="error">{formError}</InlineAlert>}
        <div className="pt-2">
          <Button type="submit" fullWidth loading={isSubmitting}>
            {isSubmitting ? SET_PASSWORD_TEXTS.SUBMITTING : SET_PASSWORD_TEXTS.SUBMIT}
          </Button>
        </div>
      </form>
    </div>
  );
}
