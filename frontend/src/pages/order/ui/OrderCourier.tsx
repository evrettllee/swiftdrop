import { ChatTextIcon, PhoneIcon } from '@phosphor-icons/react';
import { type Ref, useId } from 'react';
import type { ClientOrderCourier } from '@/shared/api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { Avatar } from '@/shared/ui/avatar';
import { CountBadge } from '@/shared/ui/badge';
import { OutlineIconButton, OutlineIconLink } from '@/shared/ui/icon-button';
import { Section } from '@/shared/ui/section';
import { ORDER_COURIER_TEXTS } from '../config/tracking';
import {
  formatCourierVehicle,
  formatCourierVehicleShort,
  getCourierInitials,
} from '../lib/courier';

type OrderCourierProps = {
  courier: NonNullable<ClientOrderCourier['courier']>;
  unreadCount: number;
  chatButtonRef: Ref<HTMLButtonElement>;
  isChatOpen: boolean;
  chatId: string;
  onChatToggle: () => void;
};

export function OrderCourier({
  courier,
  unreadCount,
  chatButtonRef,
  isChatOpen,
  chatId,
  onChatToggle,
}: OrderCourierProps) {
  const unreadId = useId();
  const vehicle = courier.vehicle === null ? null : formatCourierVehicle(courier.vehicle);
  const shortVehicle = courier.vehicle === null ? null : formatCourierVehicleShort(courier.vehicle);

  return (
    <Section title={ORDER_COURIER_TEXTS.SECTION}>
      <div className="flex items-center gap-3">
        <Avatar initials={getCourierInitials(courier.name)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span>{courier.name}</span>
          {vehicle === null ? null : (
            <span className="truncate text-small text-fg-secondary tabular-nums" title={vehicle}>
              <span className="hidden lg:inline">{vehicle}</span>
              <span className="lg:hidden">{shortVehicle}</span>
            </span>
          )}
        </div>
        {courier.phone === undefined ? null : (
          <OutlineIconLink href={`tel:${courier.phone}`} aria-label={ORDER_COURIER_TEXTS.CALL}>
            <PhoneIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
          </OutlineIconLink>
        )}
        <OutlineIconButton
          ref={chatButtonRef}
          aria-label={ORDER_COURIER_TEXTS.CHAT}
          aria-describedby={unreadCount > 0 ? unreadId : undefined}
          aria-expanded={isChatOpen}
          aria-controls={isChatOpen ? chatId : undefined}
          onClick={onChatToggle}
        >
          <ChatTextIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
          <CountBadge count={unreadCount} />
        </OutlineIconButton>
        {unreadCount > 0 ? (
          <span id={unreadId} className="sr-only">
            {ORDER_COURIER_TEXTS.chatUnread(unreadCount)}
          </span>
        ) : null}
      </div>
    </Section>
  );
}
