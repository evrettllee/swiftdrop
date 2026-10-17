import type { RefObject } from 'react';
import { useNavigate } from 'react-router';
import type { CourierOffer } from '@/shared/api';
import { MS_PER_SECOND } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { OFFER_NOTICE, OFFER_RESPONSE, OFFER_URGENT_MS, type OfferResponse } from '../config/offer';
import { OFFER_TEXTS } from '../config/texts';
import { closeOfferWithNotice } from '../model/offer-store';
import { acceptCurrentOffer, declineCurrentOffer } from '../model/respond-to-offer';
import { useOfferCountdown } from '../model/useOfferCountdown';
import { OfferTimeBar, OfferTimeLeft } from './OfferCountdown';
import { OfferDetails } from './OfferDetails';

const URGENT_SECONDS = OFFER_URGENT_MS / MS_PER_SECOND;

type OfferContentProps = {
  offer: CourierOffer;
  deadline: number;
  response: OfferResponse | null;
  error: string | null;
  titleId: string;
  acceptRef: RefObject<HTMLButtonElement | null>;
};

// On a phone a sheet in one column; on the desktop a window with a header and a footer.
export function OfferContent({
  offer,
  deadline,
  response,
  error,
  titleId,
  acceptRef,
}: OfferContentProps) {
  const navigate = useNavigate();
  const secondsLeft = useOfferCountdown(deadline, () =>
    closeOfferWithNotice(offer.offerId, OFFER_NOTICE.EXPIRED),
  );
  const isUrgent = secondsLeft <= URGENT_SECONDS;

  async function handleAccept(): Promise<void> {
    if (await acceptCurrentOffer(offer.offerId)) {
      // The work page shows the active order.
      await navigate(APP_ROUTES.COURIER_WORK);
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-0">
      <div aria-hidden="true" className="mx-auto mb-2 h-1 w-10 rounded-full bg-handle lg:hidden" />
      <div className="flex items-center justify-between gap-4 lg:border-b lg:border-border lg:px-6 lg:py-5">
        <h2 id={titleId} className="text-heading-sm font-semibold">
          {OFFER_TEXTS.TITLE}
        </h2>
        <OfferTimeLeft secondsLeft={secondsLeft} isUrgent={isUrgent} />
      </div>
      <div className="flex flex-col gap-4 lg:p-6">
        <OfferTimeBar deadline={deadline} secondsLeft={secondsLeft} isUrgent={isUrgent} />
        <OfferDetails offer={offer} />
        {error === null ? null : <InlineAlert variant="error">{error}</InlineAlert>}
      </div>
      {/* The main button first: on top on a phone, on the right on the desktop. */}
      <div className="flex flex-col gap-2 *:w-full lg:flex-row-reverse lg:gap-3 lg:border-t lg:border-border lg:bg-surface-muted lg:px-6 lg:py-4 lg:*:w-auto lg:dark:bg-surface">
        <Button
          ref={acceptRef}
          loading={response === OFFER_RESPONSE.ACCEPT}
          disabled={response !== null}
          onClick={() => void handleAccept()}
        >
          {OFFER_TEXTS.ACCEPT}
        </Button>
        <Button
          variant="secondary"
          loading={response === OFFER_RESPONSE.DECLINE}
          disabled={response !== null}
          onClick={() => void declineCurrentOffer(offer.offerId)}
        >
          {OFFER_TEXTS.DECLINE}
        </Button>
      </div>
    </div>
  );
}
