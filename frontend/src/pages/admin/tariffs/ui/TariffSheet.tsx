import { useId } from 'react';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { NAME_MAX_LENGTH, PRICE_FIELDS, TARIFF_FIELD, type PriceField } from '../config/limits';
import { EDIT_TEXTS as TEXTS } from '../config/texts';
import { NEW_TARIFF, type TariffEdit } from '../model/useTariffEdit';

const PRICE_LABELS: Record<PriceField, string> = {
  pricePerKm: TEXTS.PHONE_KM,
  pricePerKg: TEXTS.PHONE_KG,
  minPrice: TEXTS.PHONE_MIN,
  fragileFee: TEXTS.PHONE_FRAGILE,
};

export function TariffSheet({ edit }: { edit: TariffEdit }) {
  const formId = useId();
  const { draft, errors } = edit;
  const isNew = edit.target === NEW_TARIFF;

  if (draft === null) {
    return null;
  }

  return (
    <Dialog
      hasDividers
      isBodyScrolling
      isOpen
      onClose={edit.cancel}
      title={isNew ? TEXTS.NEW_TITLE : TEXTS.EDIT_TITLE}
      actions={
        <>
          <Button type="submit" form={formId} loading={edit.isSubmitting}>
            {isNew ? TEXTS.CREATE : TEXTS.SAVE}
          </Button>
          <Button variant="secondary" disabled={edit.isSubmitting} onClick={edit.cancel}>
            {TEXTS.CANCEL}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void edit.submit();
        }}
        className="grid grid-cols-2 gap-x-4 gap-y-4 text-fg"
      >
        <div className="col-span-2">
          <Input
            label={TEXTS.PHONE_NAME}
            placeholder={TEXTS.NAME_PLACEHOLDER}
            maxLength={NAME_MAX_LENGTH}
            autoComplete="off"
            value={draft.name}
            error={errors[TARIFF_FIELD.NAME]}
            onChange={(event) => edit.change(TARIFF_FIELD.NAME, event.target.value)}
          />
        </div>
        {PRICE_FIELDS.map((field) => (
          <Input
            key={field}
            label={PRICE_LABELS[field]}
            placeholder={TEXTS.PRICE_PLACEHOLDER}
            inputMode="decimal"
            autoComplete="off"
            value={draft[field]}
            error={errors[field]}
            onChange={(event) => edit.change(field, event.target.value)}
          />
        ))}
        <p className="col-span-2 text-small text-fg-secondary">{TEXTS.HINT}</p>
      </form>
    </Dialog>
  );
}
