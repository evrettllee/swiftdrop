import { ArrowLeftIcon, PhoneIcon, XIcon } from '@phosphor-icons/react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { IconButton } from '@/shared/ui/icon-button';
import { CHAT_TEXTS } from '../config/texts';

type ChatCallLinkProps = {
  phone: string;
  label: string;
};

export function ChatCallLink({ phone, label }: ChatCallLinkProps) {
  return (
    <a
      href={`tel:${phone}`}
      aria-label={label}
      className={`flex size-11 shrink-0 items-center justify-center rounded-md text-accent hover:bg-selected ${COLOR_TRANSITION_CLASS}`}
    >
      <PhoneIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
    </a>
  );
}

type ChatCloseButtonProps = {
  onClose: () => void;
};

export function ChatCloseButton({ onClose }: ChatCloseButtonProps) {
  return (
    <IconButton
      aria-label={CHAT_TEXTS.CLOSE}
      onClick={onClose}
      className="shrink-0 hover:bg-transparent"
    >
      <XIcon
        size={ICON_SIZE.MEDIUM}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="text-fg-secondary"
      />
    </IconButton>
  );
}

export function ChatBackButton({ onBack }: { onBack: () => void }) {
  return (
    <IconButton aria-label={CHAT_TEXTS.BACK} onClick={onBack} className="shrink-0">
      <ArrowLeftIcon size={ICON_SIZE.LARGE} weight={ICON_WEIGHT} aria-hidden="true" />
    </IconButton>
  );
}
