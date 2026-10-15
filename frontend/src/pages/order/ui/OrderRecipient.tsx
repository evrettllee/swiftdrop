import { formatParcelSize, formatParcelWeight } from '@/entities/order';
import type { OrderDetails } from '@/shared/api';
import { Section } from '@/shared/ui/section';
import { ORDER_DETAILS_TEXTS } from '../config/texts';
import { formatPhone } from '../lib/order-details-format';

type FieldProps = {
  label: string;
  value: string;
  // On a phone the name and the phone take a whole row, the rest two in a row.
  isWide?: boolean;
};

function Field({ label, value, isWide = false }: FieldProps) {
  return (
    <div className={`flex min-w-0 flex-col ${isWide ? 'col-span-2 lg:col-span-1' : ''}`}>
      <dt className="text-small text-fg-secondary">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

type OrderRecipientProps = {
  order: OrderDetails;
};

export function OrderRecipient({ order }: OrderRecipientProps) {
  const { recipient, parcel } = order;

  return (
    <Section title={ORDER_DETAILS_TEXTS.SECTION_RECIPIENT}>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
        <Field label={ORDER_DETAILS_TEXTS.RECIPIENT} value={recipient.name} isWide />
        <Field label={ORDER_DETAILS_TEXTS.PHONE} value={formatPhone(recipient.phone)} isWide />
        <Field label={ORDER_DETAILS_TEXTS.WEIGHT} value={formatParcelWeight(parcel)} />
        <Field label={ORDER_DETAILS_TEXTS.SIZE} value={formatParcelSize(parcel)} />
        <Field
          label={ORDER_DETAILS_TEXTS.FRAGILE}
          value={parcel.isFragile ? ORDER_DETAILS_TEXTS.YES : ORDER_DETAILS_TEXTS.NO}
        />
      </dl>
    </Section>
  );
}
