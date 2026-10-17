import { ArrowLeftIcon } from '@phosphor-icons/react';
import { useId } from 'react';
import { formatOrderNumber } from '@/entities/order';
import type { LocationSharing } from '@/features/courier-location';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { PageTitle } from '@/shared/ui/page-title';
import { DELIVERY_CODE_TEXTS, ORDER_TEXTS } from '../config/texts';
import { useDeliveryCode } from '../model/useDeliveryCode';
import { ConnectionAlert } from './ConnectionAlert';
import { DeliveryCodeField } from './DeliveryCodeField';
import { GeoAlert } from './GeoAlert';

type DeliveryCodeScreenProps = {
  orderId: number;
  location: LocationSharing;
  onBack: () => void;
  onDelivered: (closedAt: Date) => void;
  onStale: (message: string) => void;
};

// The code of the recipient closes the order. One column with the button in the page, no bar
// above the menu: the keyboard of the phone covers the end of the screen anyway.
export function DeliveryCodeScreen(props: DeliveryCodeScreenProps) {
  const { orderId, location, onBack, onDelivered, onStale } = props;
  const hintId = useId();
  const delivery = useDeliveryCode({ orderId, onDelivered, onStale });

  return (
    <div className="flex flex-col gap-6 lg:max-w-120 lg:gap-8">
      <header className="flex flex-col gap-2">
        {/* The text of the button stands in line with the page, its padding goes beyond it. */}
        <div className="-ms-4 self-start">
          <Button
            variant="text"
            icon={<ArrowLeftIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
            onClick={onBack}
          >
            {DELIVERY_CODE_TEXTS.BACK}
          </Button>
        </div>
        <span className="text-small text-fg-secondary tabular-nums">
          {ORDER_TEXTS.orderNumber(formatOrderNumber(orderId))}
        </span>
        <PageTitle>{DELIVERY_CODE_TEXTS.TITLE}</PageTitle>
        <p id={hintId} className="text-pretty text-fg-secondary">
          {DELIVERY_CODE_TEXTS.HINT}
        </p>
      </header>
      <ConnectionAlert />
      {location.problem === null ? null : (
        <GeoAlert
          problem={location.problem}
          isChecking={location.isChecking}
          onRetry={() => void location.recheck()}
        />
      )}
      <form
        noValidate
        className="flex flex-col gap-6 lg:gap-8"
        onSubmit={(event) => {
          event.preventDefault();
          void delivery.submit();
        }}
      >
        <DeliveryCodeField
          code={delivery.code}
          error={delivery.error}
          isWrong={delivery.isWrong}
          isPending={delivery.isPending}
          hintId={hintId}
          inputRef={delivery.inputRef}
          onChange={delivery.change}
        />
        <Button
          type="submit"
          fullWidth
          loading={delivery.isPending}
          disabled={!delivery.isComplete}
        >
          {DELIVERY_CODE_TEXTS.SUBMIT}
        </Button>
      </form>
    </div>
  );
}
