import { formatTime } from '@/shared/lib/format';
import type { ManagerOrderOffer } from '@/shared/staff-api';
import { Section } from '@/shared/ui/section';
import { OFFER_ANSWER_CLASSES, OFFER_ANSWER_LABELS } from '../config/offers';
import { MANAGER_ORDER_TEXTS, OFFERS_TEXTS } from '../config/texts';
import { offerPickupText, offerVehicleLabel } from '../lib/order-facts';

const HEAD_CLASS =
  'h-11 border-b border-border text-caption font-semibold tracking-caps whitespace-nowrap text-fg-secondary uppercase';

function offerKey(offer: ManagerOrderOffer): string {
  return `${offer.round}:${offer.courier.id}:${offer.offeredAt.getTime()}`;
}

type OffersProps = {
  offers: readonly ManagerOrderOffer[];
};

function OffersTable({ offers }: OffersProps) {
  return (
    <table className="hidden w-full border-collapse text-small lg:table">
      <thead>
        <tr>
          <th scope="col" className={`${HEAD_CLASS} text-start`}>
            {OFFERS_TEXTS.COURIER}
          </th>
          <th scope="col" className={`${HEAD_CLASS} pe-4 text-end`}>
            {OFFERS_TEXTS.PICKUP}
          </th>
          <th scope="col" className={`${HEAD_CLASS} text-start`}>
            {OFFERS_TEXTS.ANSWER}
          </th>
          <th scope="col" className={`${HEAD_CLASS} text-end`}>
            {OFFERS_TEXTS.TIME}
          </th>
        </tr>
      </thead>
      <tbody>
        {offers.map((offer) => {
          const vehicle = offerVehicleLabel(offer);

          return (
            <tr key={offerKey(offer)} className="border-b border-border last:border-b-0">
              <td className="py-2">
                <span className="flex flex-col">
                  <span className="text-body">{offer.courier.name}</span>
                  {vehicle === null ? null : (
                    <span className="text-caption text-fg-secondary">{vehicle}</span>
                  )}
                </span>
              </td>
              <td className="pe-4 text-end font-semibold tabular-nums">{offerPickupText(offer)}</td>
              <td className={OFFER_ANSWER_CLASSES[offer.status]}>
                {OFFER_ANSWER_LABELS[offer.status]}
              </td>
              <td className="text-end text-fg-secondary tabular-nums">
                {formatTime(offer.offeredAt)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function OffersList({ offers }: OffersProps) {
  return (
    <ul className="flex flex-col lg:hidden">
      {offers.map((offer) => (
        <li
          key={offerKey(offer)}
          className="flex min-h-14 items-center justify-between gap-3 border-b border-border"
        >
          <span className="min-w-0 truncate">{offer.courier.name}</span>
          <span className="flex shrink-0 flex-col items-end">
            <span className="font-semibold tabular-nums">{offerPickupText(offer)}</span>
            <span className={`text-small ${OFFER_ANSWER_CLASSES[offer.status]}`}>
              {OFFER_ANSWER_LABELS[offer.status]}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function OffersSection({ offers }: OffersProps) {
  return (
    <Section title={MANAGER_ORDER_TEXTS.SECTION_OFFERS}>
      <OffersTable offers={offers} />
      <OffersList offers={offers} />
    </Section>
  );
}
