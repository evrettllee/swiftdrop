import { formatPhone } from '@/shared/lib/format';
import type { ManagerOrderDetails } from '@/shared/staff-api';
import { Section } from '@/shared/ui/section';
import { MANAGER_ORDER_TEXTS as TEXTS } from '../config/texts';
import { Fact } from './Fact';

type ClientSectionProps = {
  client: ManagerOrderDetails['client'];
};

export function ClientSection({ client }: ClientSectionProps) {
  return (
    <Section title={TEXTS.SECTION_CLIENT}>
      <dl className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <Fact label={TEXTS.NAME}>{client.name}</Fact>
        <Fact label={TEXTS.PHONE}>
          {client.phone === null ? TEXTS.NO_PHONE : formatPhone(client.phone)}
        </Fact>
        <Fact label={TEXTS.EMAIL}>{client.email}</Fact>
      </dl>
    </Section>
  );
}
