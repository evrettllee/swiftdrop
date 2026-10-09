import { MapPinIcon } from '@phosphor-icons/react';
import { EmptyState } from '@/shared/ui/empty-state';
import { ADDRESSES_TEXTS } from '../config/texts';

// A placeholder inside the client layout until the saved addresses are made.
export function AddressesPage() {
  return (
    <div className="flex flex-col gap-4 lg:gap-8">
      <h1 className="text-heading-md font-bold text-balance lg:text-heading-lg">
        {ADDRESSES_TEXTS.ADDRESSES}
      </h1>
      <EmptyState icon={MapPinIcon} title={ADDRESSES_TEXTS.ADDRESSES} text={ADDRESSES_TEXTS.HINT} />
    </div>
  );
}
