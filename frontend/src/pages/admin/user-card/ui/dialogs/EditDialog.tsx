import { useId } from 'react';
import { USER_FIELD, withConflictField } from '@/entities/admin-user';
import { useForm } from '@/shared/lib/forms';
import { PHONE_EXAMPLE, PHONE_INPUT_MAX_LENGTH } from '@/shared/lib/person-validation';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { Input } from '@/shared/ui/input';
import type { AdminUserCard, StaffChanges } from '../../api/admin-user-card';
import { DIALOG_TEXTS as TEXTS } from '../../config/dialog-texts';
import { editFormSchema, editInitialValues } from '../../model/edit-form';

type EditDialogProps = {
  card: AdminUserCard;
  isOpen: boolean;
  onClose: () => void;
  run: (changes: StaffChanges) => Promise<AdminUserCard>;
  onDone: (card: AdminUserCard) => void;
};

export function EditDialog({ card, isOpen, onClose, run, onDone }: EditDialogProps) {
  const formId = useId();
  const { formRef, field, formError, isSubmitting, handleSubmit } = useForm({
    initialValues: editInitialValues(card),
    schema: editFormSchema,
    onSubmit: async (changes) => {
      try {
        onDone(await run(changes));
      } catch (error) {
        throw withConflictField(error);
      }
    },
  });

  return (
    <Dialog
      width="large"
      isOpen={isOpen}
      onClose={onClose}
      title={TEXTS.EDIT_TITLE}
      actions={
        <>
          <Button type="submit" form={formId} loading={isSubmitting}>
            {TEXTS.EDIT_CONFIRM}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {TEXTS.CANCEL}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        ref={formRef}
        noValidate
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 text-fg"
      >
        <Input label={TEXTS.FIRST_NAME} autoComplete="off" {...field(USER_FIELD.FIRST_NAME)} />
        <Input label={TEXTS.LAST_NAME} autoComplete="off" {...field(USER_FIELD.LAST_NAME)} />
        <Input
          label={TEXTS.PHONE}
          type="tel"
          autoComplete="off"
          placeholder={PHONE_EXAMPLE}
          maxLength={PHONE_INPUT_MAX_LENGTH}
          {...field(USER_FIELD.PHONE)}
        />
        <Input
          label={TEXTS.EMAIL}
          type="email"
          value={card.email}
          readOnly
          disabled
          hint={TEXTS.EMAIL_HINT}
        />
        {formError === null ? null : <InlineAlert variant="error">{formError}</InlineAlert>}
      </form>
    </Dialog>
  );
}
