import { useEffect } from 'react';
import { Toast } from '@/shared/ui/toast';
import { OFFER_NOTICE, OFFER_NOTICE_MS } from '../config/offer';
import { OFFER_NOTICE_TEXTS } from '../config/texts';
import { hideOfferNotice, useOfferStore } from '../model/offer-store';

// Why the offer window closed: above the bottom menu on a phone, in the corner on the desktop.
// The live region stays in the page, so a screen reader reads every new message.
export function OfferNotice() {
  const notice = useOfferStore((state) => state.notice);
  const noticeId = useOfferStore((state) => state.noticeId);

  useEffect(() => {
    if (notice === null) {
      return undefined;
    }

    const timer = window.setTimeout(hideOfferNotice, OFFER_NOTICE_MS);

    return () => window.clearTimeout(timer);
  }, [notice, noticeId]);

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-4 bottom-20 z-40 lg:inset-x-auto lg:right-12 lg:bottom-12 lg:w-96"
    >
      {notice === null ? null : (
        <div className="pointer-events-auto">
          <Toast
            variant={notice === OFFER_NOTICE.EXPIRED ? 'warning' : 'info'}
            title={OFFER_NOTICE_TEXTS[notice].title}
            text={OFFER_NOTICE_TEXTS[notice].text}
            onClose={hideOfferNotice}
          />
        </div>
      )}
    </div>
  );
}
