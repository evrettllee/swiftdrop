import { INVITABLE_ROLES, type InvitableRole, withConflictField } from '@/entities/admin-user';
import { PHONE_EXAMPLE, PHONE_INPUT_MAX_LENGTH } from '@/shared/lib/person-validation';
import { useForm } from '@/shared/lib/forms';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { Input } from '@/shared/ui/input';
import { RadioCard } from '@/shared/ui/radio-card';
import { inviteStaff, type InviteStaffInput, type StaffInvite } from '../api/invite-staff';
import { INVITE_STAFF_TEXTS as TEXTS } from '../config/invite-texts';
import { INVITE_FIELD, INVITE_INITIAL_VALUES, inviteFormSchema } from '../model/invite-form';

const ROLE_CARDS: Record<InvitableRole, { title: string; hint: string; shortHint: string }> = {
  courier: { title: TEXTS.COURIER, hint: TEXTS.COURIER_HINT, shortHint: TEXTS.COURIER_HINT_SHORT },
  manager: { title: TEXTS.MANAGER, hint: TEXTS.MANAGER_HINT, shortHint: TEXTS.MANAGER_HINT_SHORT },
};

type InviteFormProps = {
  formId: string;
  isDesktop: boolean;
  onSubmittingChange: (isSubmitting: boolean) => void;
  onInvited: (invite: StaffInvite, input: InviteStaffInput) => void;
};

export function InviteForm({ formId, isDesktop, onSubmittingChange, onInvited }: InviteFormProps) {
  const { formRef, values, field, formError, handleSubmit } = useForm({
    initialValues: INVITE_INITIAL_VALUES,
    schema: inviteFormSchema,
    onSubmit: async (input) => {
      onSubmittingChange(true);

      try {
        onInvited(await inviteStaff(input), input);
      } catch (error) {
        throw withConflictField(error);
      } finally {
        onSubmittingChange(false);
      }
    },
  });
  const role = field(INVITE_FIELD.ROLE);

  return (
    <form
      id={formId}
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 text-fg"
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-caption font-semibold tracking-wide text-fg-secondary uppercase">
          {TEXTS.ROLE}
        </legend>
        {INVITABLE_ROLES.map((item) => (
          <RadioCard
            key={item}
            name={role.name}
            value={item}
            checked={values[INVITE_FIELD.ROLE] === item}
            onChange={role.onChange}
            density="centered"
            title={ROLE_CARDS[item].title}
            description={isDesktop ? ROLE_CARDS[item].hint : ROLE_CARDS[item].shortHint}
          />
        ))}
      </fieldset>
      <Input label={TEXTS.FIRST_NAME} autoComplete="off" {...field(INVITE_FIELD.FIRST_NAME)} />
      <Input label={TEXTS.LAST_NAME} autoComplete="off" {...field(INVITE_FIELD.LAST_NAME)} />
      <Input label={TEXTS.EMAIL} type="email" autoComplete="off" {...field(INVITE_FIELD.EMAIL)} />
      <Input
        label={TEXTS.PHONE}
        type="tel"
        autoComplete="off"
        placeholder={PHONE_EXAMPLE}
        maxLength={PHONE_INPUT_MAX_LENGTH}
        {...field(INVITE_FIELD.PHONE)}
      />
      <p className="text-small text-fg-secondary">{TEXTS.LINK_HINT}</p>
      {formError === null ? null : <InlineAlert variant="error">{formError}</InlineAlert>}
    </form>
  );
}
