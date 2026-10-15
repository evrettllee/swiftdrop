import { MapPinIcon } from '@phosphor-icons/react';
import { EmptyState } from '@/shared/ui/empty-state';
import { PageTitle } from '@/shared/ui/page-title';
import { ADDRESSES_TEXTS } from '../config/texts';

// A placeholder inside the client layout until the saved addresses are made.
export function AddressesPage() {
  return (
    <div className="flex flex-col gap-4 lg:gap-8">
      <PageTitle>{ADDRESSES_TEXTS.ADDRESSES}</PageTitle>
      <EmptyState icon={MapPinIcon} title={ADDRESSES_TEXTS.ADDRESSES} text={ADDRESSES_TEXTS.HINT} />
    </div>
  );
}
