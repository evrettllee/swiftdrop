import { formatParcelSize, formatParcelWeight, PARCEL_FACT_TEXTS } from '@/entities/order';
import { formatPhone } from '@/shared/lib/format';
import type { ManagerOrderDetails } from '@/shared/staff-api';
import { Section } from '@/shared/ui/section';
import { MANAGER_ORDER_TEXTS as TEXTS } from '../config/texts';
import { Fact } from './Fact';

type RecipientSectionProps = {
  recipient: ManagerOrderDetails['recipient'];
  parcel: ManagerOrderDetails['parcel'];
};

export function RecipientSection({ recipient, parcel }: RecipientSectionProps) {
  const sizes = {
    weightKg: parcel.weight,
    lengthCm: parcel.length,
    widthCm: parcel.width,
    heightCm: parcel.height,
  };

  return (
    <Section title={TEXTS.SECTION_RECIPIENT}>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
        <Fact label={TEXTS.RECIPIENT} className="col-span-2 lg:col-span-1">
          {recipient.name}
        </Fact>
        <Fact label={TEXTS.PHONE} className="col-span-2 lg:col-span-1">
          {formatPhone(recipient.phone)}
        </Fact>
        <Fact label={PARCEL_FACT_TEXTS.WEIGHT}>{formatParcelWeight(sizes)}</Fact>
        <Fact label={PARCEL_FACT_TEXTS.SIZE}>{formatParcelSize(sizes)}</Fact>
        <Fact label={PARCEL_FACT_TEXTS.FRAGILE}>
          {parcel.fragile ? PARCEL_FACT_TEXTS.YES : PARCEL_FACT_TEXTS.NO}
        </Fact>
      </dl>
    </Section>
  );
}
